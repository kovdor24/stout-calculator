package ru.heatcalc.app;

import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;

/**
 * Работа с файлами так, как её ждут от приложения, а не от вкладки браузера:
 * сохранить в «Загрузки», отправить в мессенджер, открыть в просмотрщике.
 *
 * Зачем вообще. Смета, счёт, договор и выгрузка в Excel собираются в браузерную
 * ссылку blob: и «скачиваются» щелчком по невидимой ссылке. В обычном браузере
 * это работает, а встроенный WebView такие ссылки не скачивает совсем: без
 * DownloadListener нажатие просто ничего не делает — крутится «Формируем PDF…»,
 * и файла нет. Capacitor своего обработчика не ставит, поэтому ставим свой.
 *
 * Плагин собственный, без пакета из npm: package-lock.json не трогаем, а
 * конвейер собирает проект командой npm ci, которой любое расхождение с
 * package.json — ошибка.
 *
 * Из разметки зовётся так:
 *     window.Capacitor.Plugins.HcNative.save({ name, mime, data })
 * где data — содержимое файла в base64. Регистрирует его MainActivity.
 */
@CapacitorPlugin(name = "HcNative")
public class HcNativePlugin extends Plugin {

    /** Папка внутри кэша, откуда файлы уходят в мессенджеры. */
    private static final String SHARE_DIR = "share";

    /**
     * Адрес, которым браузер разбудил приложение после входа через Яндекс ID.
     *
     * Поле общее на всё приложение: адрес приходит в MainActivity, а забирает
     * его страница — и, если приложение только что запустилось, забирает уже
     * после того, как разметка загрузилась. Иначе код авторизации пропал бы
     * в промежутке между запуском и готовностью страницы.
     */
    private static String pendingUrl;

    static void setPendingUrl(String url) {
        pendingUrl = url;
    }

    /** Отдаёт странице адрес возврата и забывает его: второй раз он не нужен. */
    @PluginMethod
    public void takeUrl(PluginCall call) {
        JSObject res = new JSObject();
        res.put("url", pendingUrl);
        pendingUrl = null;
        call.resolve(res);
    }

    /**
     * Кладёт файл в общую папку «Загрузки» — туда же, куда складывает файлы
     * браузер, и там его найдёт любой файловый менеджер.
     */
    @PluginMethod
    public void save(PluginCall call) {
        String name = safeName(call.getString("name", "file"));
        String mime = mimeFor(call.getString("mime"), name);
        byte[] bytes = decode(call.getString("data"));

        if (bytes == null) {
            call.reject("Пустое содержимое файла");
            return;
        }

        try {
            Uri uri;
            String where;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10 и новее: пишем через общее хранилище, разрешений не
                // требуется. IS_PENDING прячет недописанный файл от других
                // программ — иначе файловый менеджер успевает показать обрезок.
                ContentResolver cr = getContext().getContentResolver();

                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, name);
                values.put(MediaStore.Downloads.MIME_TYPE, mime);
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Хранилище не отдало место под файл");
                    return;
                }

                OutputStream os = cr.openOutputStream(uri);
                if (os == null) {
                    call.reject("Не удалось открыть файл на запись");
                    return;
                }
                try {
                    os.write(bytes);
                } finally {
                    os.close();
                }

                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                cr.update(uri, values, null, null);

                where = "Загрузки";
            } else {
                // Android 9 и старше: общая папка требует разрешения на всю
                // память телефона. Просить его ради одного файла — перебор,
                // поэтому кладём в свою папку и отдаём наружу через провайдер:
                // «Поделиться» и «Открыть» работают так же.
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) {
                    call.reject("Внешнее хранилище недоступно");
                    return;
                }
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Не удалось создать папку для файла");
                    return;
                }

                File file = new File(dir, name);
                FileOutputStream fos = new FileOutputStream(file);
                try {
                    fos.write(bytes);
                } finally {
                    fos.close();
                }

                uri = provide(file);
                where = "Файлы приложения";
            }

            JSObject res = new JSObject();
            res.put("uri", uri.toString());
            res.put("name", name);
            res.put("mime", mime);
            res.put("where", where);
            call.resolve(res);
        } catch (Exception e) {
            // Причину прячем в журнал: человеку в окне она ничего не объяснит.
            call.reject("Не удалось сохранить файл", e);
        }
    }

    /**
     * Системный лист «Поделиться»: смета уходит в WhatsApp, Telegram или почту
     * одним движением, без сохранения и поиска файла вручную.
     */
    @PluginMethod
    public void share(PluginCall call) {
        String name = safeName(call.getString("name", "file"));
        String mime = mimeFor(call.getString("mime"), name);
        String text = call.getString("text");
        byte[] bytes = decode(call.getString("data"));

        try {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(bytes == null ? "text/plain" : mime);

            if (bytes != null) {
                File dir = new File(getContext().getCacheDir(), SHARE_DIR);
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Не удалось подготовить файл к отправке");
                    return;
                }
                File file = new File(dir, name);
                FileOutputStream fos = new FileOutputStream(file);
                try {
                    fos.write(bytes);
                } finally {
                    fos.close();
                }
                send.putExtra(Intent.EXTRA_STREAM, provide(file));
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            if (text != null && !text.isEmpty()) {
                send.putExtra(Intent.EXTRA_TEXT, text);
            }

            Intent chooser = Intent.createChooser(send, "Отправить");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("Не удалось отправить файл", e);
        }
    }

    /** Открывает уже сохранённый файл в подходящей программе. */
    @PluginMethod
    public void open(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null || uri.isEmpty()) {
            call.reject("Не указан файл");
            return;
        }

        Intent view = new Intent(Intent.ACTION_VIEW);
        view.setDataAndType(Uri.parse(uri), mimeFor(call.getString("mime"), uri));
        view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        try {
            getActivity().startActivity(view);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            // Штатный случай: PDF нечем открыть, программу для просмотра не
            // поставили. Сообщение показывает страница, ей и решать.
            call.reject("Нет программы для открытия этого файла", e);
        }
    }

    // ------------------------------------------------------------ мелочи

    private Uri provide(File file) {
        return FileProvider.getUriForFile(
                getContext(), getContext().getPackageName() + ".fileprovider", file);
    }

    private byte[] decode(String base64) {
        if (base64 == null || base64.isEmpty()) return null;
        try {
            return Base64.decode(base64, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Имя файла без разделителей пути: смета называется по объекту, а его имя
     * человек вводит сам и может поставить туда косую черту.
     */
    private String safeName(String name) {
        if (name == null || name.trim().isEmpty()) return "file";
        String clean = name.replaceAll("[\\\\/:*?\"<>|\\r\\n]", " ").trim();
        return clean.isEmpty() ? "file" : clean;
    }

    /** Если страница тип не назвала, выводим его из расширения. */
    private String mimeFor(String mime, String name) {
        if (mime != null && !mime.isEmpty()) return mime;

        int dot = name == null ? -1 : name.lastIndexOf('.');
        if (dot >= 0 && dot < name.length() - 1) {
            String ext = name.substring(dot + 1).toLowerCase(Locale.ROOT);
            String guess = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            if (guess != null) return guess;
        }
        return "application/octet-stream";
    }
}
