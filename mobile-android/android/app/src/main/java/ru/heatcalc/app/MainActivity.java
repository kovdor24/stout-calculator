package ru.heatcalc.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Время предыдущего нажатия «Назад» на главном экране. */
    private long lastBackPress = 0;

    /** Сколько ждём второго нажатия, прежде чем забыть про первое, мс. */
    private static final long EXIT_WINDOW = 2000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Сохранение файлов, «Поделиться» и открытие в просмотрщике. Строго до
        // super.onCreate: позже Capacitor уже собрал список плагинов, и наш в
        // него не попадёт.
        registerPlugin(HcNativePlugin.class);

        // Тему заставки снимает сам Capacitor: BridgeActivity.onCreate ставит
        // AppTheme.NoActionBar. Стиль с таким именем есть и в библиотеке, и у
        // нас в values/styles.xml — при сборке наш перекрывает её.
        super.onCreate(savedInstanceState);

        applySystemBarInsets();
        applySystemBarAppearance();
        installBackHandler();

        // Приложение запустили по ссылке возврата (холодный старт после входа
        // через Яндекс ID). Страницы ещё нет — просто откладываем адрес, её
        // код заберёт его сам, когда загрузится.
        rememberUrl(getIntent());
    }

    /**
     * Возврат из браузера в уже открытое приложение — обычный случай для входа
     * через Яндекс ID: человек нажал кнопку внутри приложения, ушёл в браузер
     * и вернулся. Активность объявлена singleTask, поэтому повторного запуска
     * не будет, адрес приходит сюда.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (rememberUrl(intent) && bridge != null) {
            bridge.eval("window.hcNativeUrlReady && window.hcNativeUrlReady()", value -> { });
        }
    }

    private boolean rememberUrl(Intent intent) {
        Uri data = intent == null ? null : intent.getData();
        if (data == null) return false;
        HcNativePlugin.setPendingUrl(data.toString());
        return true;
    }

    /**
     * Отступы под строку состояния и панель навигации.
     *
     * Начиная с Android 15 система разворачивает окно на весь экран, а с восьмой
     * версии Capacitor сам их больше не проставляет (настройку
     * adjustMarginsForEdgeToEdge убрали). Без этого шапка калькулятора уезжает
     * под часы и заряд батареи, и приложение выглядит недоделанным.
     */
    private void applySystemBarInsets() {
        final View content = findViewById(android.R.id.content);
        if (content == null) return;

        ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            // Вырезки не гасим: клавиатуру двигает сам Capacitor, и если забрать
            // отступы себе, поле ввода перестанет подниматься над ней.
            return windowInsets;
        });
    }

    /**
     * Часы, связь и заряд — белым. Полосы под ними закрашены фирменным синим
     * (windowBackground в теме), тёмные значки на нём не читались бы.
     */
    private void applySystemBarAppearance() {
        WindowInsetsControllerCompat bars =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.setAppearanceLightStatusBars(false);
        bars.setAppearanceLightNavigationBars(false);
    }

    /**
     * Кнопка «Назад».
     *
     * Сначала спрашиваем разметку: открыто ли какое-нибудь окно (вход, профиль,
     * замена позиции). Если да — закрываем его и остаёмся в приложении. Если
     * закрывать нечего, выходим по второму нажатию: одиночное нажатие на
     * заполненной смете выкидывало бы человека из приложения без предупреждения.
     *
     * Через диспетчер, а не через onBackPressed(): приложения, собранные под
     * Android 15 и новее, получают предсказуемый возврат, и старый метод система
     * уже не зовёт.
     */
    private void installBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge == null) {
                    finish();
                    return;
                }
                // Ответ приходит не сразу — страница отвечает своим потоком,
                // поэтому решение принимаем внутри обратного вызова.
                bridge.eval("window.hcNativeBack ? !!window.hcNativeBack() : false", value -> {
                    if ("true".equals(value)) return;

                    long now = System.currentTimeMillis();
                    if (now - lastBackPress < EXIT_WINDOW) {
                        finish();
                        return;
                    }
                    lastBackPress = now;
                    Toast.makeText(MainActivity.this,
                            "Нажмите «Назад» ещё раз, чтобы выйти", Toast.LENGTH_SHORT).show();
                });
            }
        });
    }
}
