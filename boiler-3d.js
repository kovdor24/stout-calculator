/**
 * Boiler3D - 3D Boiler Room Visualization Engine for HeatCalc.ru
 * Powered by Three.js
 */
(function () {
    const Boiler3D = {
        container: null,
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        raycaster: null,
        mouse: null,
        resizeObserver: null,

        // Interactive states
        interactiveObjects: [],
        hoveredObject: null,
        originalMaterials: new Map(),

        // Overlays
        uiOverlay: null,
        tooltipEl: null,

        // Rendering state
        viewMode: 'realistic', // 'realistic' | 'sketch'
        flowAnimated: true,
        animationFrameId: null,
        pipes: [], // Track animated pipe elements

        // Coordinates System Layout
        layout: {
            wallW: 5.2,
            wallH: 3.0,
            floorD: 3.2,

            // Component positions
            boilerGas: { x: -0.8, y: 1.7, z: 0.15, w: 0.45, h: 0.8, d: 0.35, label: "Газовый котёл" },
            boilerEl: { x: 0.1, y: 1.7, z: 0.12, w: 0.35, h: 0.6, d: 0.22, label: "Электрический котёл" },
            // Группа быстрого монтажа котла POLIS — висит вплотную под котлом, на его
            // патрубках, а не в ряду насосных групп коллектора: это котловой контур.
            boilerGbm: { x: 0.1, y: 1.19, z: 0.14, w: 0.3, h: 0.3, d: 0.19, label: "Группа быстрого монтажа котла" },
            boilerSolid: { x: -1.3, y: 0.7, z: 0.5, w: 0.6, h: 1.1, d: 0.7, label: "Твердотопливный котёл" },
            waterHeater: { x: -1.9, y: 0.8, z: 0.65, w: 0.6, h: 1.6, d: 0.6, label: "Бойлер ГВС" },
            
            manifold: { x: 0.9, y: 0.8, z: 0.15, w: 1.3, h: 0.16, d: 0.16, label: "Распределительный коллектор" },
            hydroSeparator: { x: -0.15, y: 0.85, z: 0.15, w: 0.15, h: 0.65, d: 0.15, label: "Гидравлический разделитель" },
            
            pumpGroupStart: { x: 0.4, y: 1.25, z: 0.2 },
            pumpGroupOffset: 0.36,
            pumpGroupSize: { w: 0.25, h: 0.4, d: 0.18 },
            
            tankHeating: { x: 1.8, y: 0.45, z: 0.4, r: 0.22, h: 0.55, label: "Расширительный бак отопления" },
            tankGvs: { x: 2.25, y: 0.45, z: 0.4, r: 0.2, h: 0.5, label: "Расширительный бак ГВС" },
            
            filter: { x: 2.3, y: 1.4, z: 0.15, w: 0.2, h: 0.5, d: 0.2, label: "Фильтр очистки воды" }
        },

        initAndRender: function (container, state, equipmentList) {
            // Clean up old instance if exists
            this.dispose();

            this.container = container;
            this.container.style.position = 'relative';
            this.container.innerHTML = '';

            // 1. Create HTML Tooltip
            this.tooltipEl = document.createElement('div');
            this.tooltipEl.style.position = 'absolute';
            this.tooltipEl.style.display = 'none';
            this.tooltipEl.style.pointerEvents = 'none';
            this.tooltipEl.style.background = 'rgba(15, 23, 42, 0.85)';
            this.tooltipEl.style.backdropFilter = 'blur(6px)';
            this.tooltipEl.style.border = '1px solid rgba(148, 163, 184, 0.2)';
            this.tooltipEl.style.color = '#f8fafc';
            this.tooltipEl.style.padding = '10px 14px';
            this.tooltipEl.style.borderRadius = '8px';
            this.tooltipEl.style.fontSize = '12px';
            this.tooltipEl.style.fontFamily = "'Inter', sans-serif";
            this.tooltipEl.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
            this.tooltipEl.style.zIndex = '1000';
            this.tooltipEl.style.transition = 'opacity 0.15s ease';
            this.container.appendChild(this.tooltipEl);

            // 2. Create UI Control Overlay (на снимке для листа его нет)
            if (!this._snap) this.createUIOverlay(state);

            // 3. Initialize Three.js Scene, Camera, Renderer
            this.scene = new THREE.Scene();
            // Для листа проекта фон белый: тёмная сцена на печати съедает тонер
            // и «заливает» рамку листа.
            this.scene.background = new THREE.Color(this._snap ? 0xffffff
                : (this.viewMode === 'realistic' ? 0x0f172a : 0x020617));

            // Fog for depth in realistic mode
            if (this.viewMode === 'realistic' && !this._snap) {
                this.scene.fog = new THREE.FogExp2(0x0f172a, 0.1);
            }

            this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
            // Общий вид (три четверти) — как на листе «3D вид котельной» в
            // проектах-образцах; точную дистанцию подберём по габариту сцены
            // после сборки оборудования, иначе трубы уходят за кадр.
            if (this._snap) this.camera.position.set(2.6, 2.2, 4.4);
            else this.camera.position.set(0, 1.8, 4.6);

            this.renderer = new THREE.WebGLRenderer({ antialias: true,
                preserveDrawingBuffer: !!this._snap });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.container.appendChild(this.renderer.domElement);

            // 4. Orbit Controls (снимку для листа они не нужны — крутить некому)
            if (!this._snap) {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
                this.controls.minDistance = 1.5;
                this.controls.maxDistance = 12;
                this.controls.target.set(0.1, 1.1, 0);
                this.controls.update();
            } else {
                this.camera.lookAt(0.1, 1.1, 0);
            }

            // 5. Lighting
            this.setupLights();

            // 6. Raycasting for Mouse Hovers
            this.raycaster = new THREE.Raycaster();
            this.mouse = new THREE.Vector2();
            this.interactiveObjects = [];
            this.originalMaterials.clear();

            // 7. Add Environment (Floor, Wall, Grid)
            this.buildEnvironment();

            // 8. Build Equipment and Pipes based on calculation lists
            this.buildBoilerRoom(equipmentList, state);

            // 9. Event Listeners
            if (!this._snap) this.setupEvents();

            // 10. Start Animation Loop (снимок рисуется одним кадром)
            if (this._snap) {
                this.fitSnapCamera();
                this.renderer.render(this.scene, this.camera);
            }
            else this.animate();
        },

        /**
         * Кадр по габариту сцены: оборудование целиком, поля одинаковые.
         * Без этого трубы к коллектору уходили за верхнюю кромку листа.
         */
        fitSnapCamera: function () {
            var bb = new THREE.Box3();
            var self = this;
            this.scene.traverse(function (o) {
                if (o.isMesh && !o.userData.env) bb.expandByObject(o);
            });
            if (bb.isEmpty()) return;
            var size = bb.getSize(new THREE.Vector3());
            var target = bb.getCenter(new THREE.Vector3());
            var dir = new THREE.Vector3(0.62, 0.42, 1).normalize();
            var dist = Math.max(size.x, size.y, size.z) * 2;
            for (var it = 0; it < 4; it++) {
                this.camera.position.copy(target).add(dir.clone().multiplyScalar(dist));
                this.camera.lookAt(target);
                this.camera.updateMatrixWorld(true); this.camera.updateProjectionMatrix();
                var xs = [], ys = [];
                for (var i = 0; i < 8; i++) {
                    var p = new THREE.Vector3(i & 1 ? bb.max.x : bb.min.x,
                        i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).project(this.camera);
                    xs.push(p.x); ys.push(p.y);
                }
                var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
                var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
                var visH = 2 * Math.tan(this.camera.fov * Math.PI / 360) * dist;
                var visW = visH * this.camera.aspect;
                var fwd = this.camera.getWorldDirection(new THREE.Vector3());
                var right = new THREE.Vector3().crossVectors(fwd, this.camera.up).normalize();
                var up = new THREE.Vector3().crossVectors(right, fwd).normalize();
                target.add(right.multiplyScalar((x0 + x1) / 2 * visW / 2))
                      .add(up.multiplyScalar((y0 + y1) / 2 * visH / 2));
                dist *= Math.max((x1 - x0) / 1.72, (y1 - y0) / 1.72);
            }
        },

        /**
         * Снимок котельной для листа «Общий вид котельной».
         *
         * Та же сцена, что в калькуляторе, но офф-скрин: белый фон, общий
         * ракурс, без интерфейса, кадр один. Модели .glb не берём — они
         * приходят асинхронно и в кадр не попали бы; рисуем процедурные,
         * как в режиме эскиза.
         *
         * Возвращает data:image/jpeg (в localStorage листов уходит смета
         * целиком, PNG раздул бы её на мегабайты) либо null.
         */
        snapshot: function (state, equipmentList, o) {
            o = o || {};
            if (typeof THREE === 'undefined') return null;
            var W = o.width || 1600, H = o.height || 1000, url = null;
            var host = document.createElement('div');
            host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;' +
                'width:' + W + 'px;height:' + H + 'px;';
            document.body.appendChild(host);
            this._snap = true;
            try {
                this.initAndRender(host, state, equipmentList || []);
                url = this.renderer.domElement.toDataURL('image/jpeg', 0.86);
            } catch (e) {
                console.warn('[3D] снимок не получился:', e.message);
            }
            this._snap = false;
            try { this.dispose(); } catch (e) { }
            if (host.parentNode) host.parentNode.removeChild(host);
            return url;
        },

        loadModelOrFallback: function (item, pos, drawProceduralCallback) {
            // In sketch mode, we always use the wireframe procedural model for performance and styling.
            // Снимок для листа рисуется одним кадром — асинхронная модель в него не успеет.
            if (this.viewMode === 'sketch' || this._snap) {
                drawProceduralCallback();
                return;
            }

            const sku = item.displaySku || item.sku || item.id || "";
            if (!sku) {
                drawProceduralCallback();
                return;
            }

            const brand = (item.brand || "STOUT").toLowerCase();
            const modelUrl = `./models/${brand}/${sku}.glb`;

            if (!this.gltfLoader) {
                this.gltfLoader = new THREE.GLTFLoader();
            }

            this.gltfLoader.load(
                modelUrl,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Enable shadow casting and receiving on all children
                    model.traverse(child => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            // Attach item data for raycast hovers
                            child.userData = { item: item };
                            this.interactiveObjects.push(child);
                        }
                    });

                    // Position the model
                    model.position.set(pos.x, pos.y, pos.z);

                    // Compute current bounding box to scale model nicely to our layout dimensions
                    const box = new THREE.Box3().setFromObject(model);
                    const size = new THREE.Vector3();
                    box.getSize(size);

                    // If pos.w, pos.h, pos.d are specified, we scale to match the target box size
                    if (pos.w && pos.h && pos.d) {
                        const scaleX = pos.w / (size.x || 1);
                        const scaleY = pos.h / (size.y || 1);
                        const scaleZ = pos.d / (size.z || 1);
                        model.scale.set(scaleX, scaleY, scaleZ);
                    } else if (pos.r && pos.h) {
                        const targetW = pos.r * 2;
                        const scaleX = targetW / (size.x || 1);
                        const scaleY = pos.h / (size.y || 1);
                        const scaleZ = targetW / (size.z || 1);
                        model.scale.set(scaleX, scaleY, scaleZ);
                    }

                    this.scene.add(model);
                },
                undefined, // onProgress
                (err) => {
                    // Fallback to procedural visualization if file is not found (404) or failed to load
                    drawProceduralCallback();
                }
            );
        },

        setupLights: function () {
            // Снимок для листа проекта — студийный свет: ровный, нейтральный,
            // с мягкой тенью. Синий и оранжевый акценты вьюера на печати
            // выглядят как подсветка витрины, а не как чертёж.
            if (this._snap) {
                this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe3e8, 0.85));
                var key = new THREE.DirectionalLight(0xffffff, 0.85);
                key.position.set(3.5, 6, 4.5);
                key.castShadow = true;
                key.shadow.mapSize.width = 2048; key.shadow.mapSize.height = 2048;
                key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
                var dd = 4;
                key.shadow.camera.left = -dd; key.shadow.camera.right = dd;
                key.shadow.camera.top = dd; key.shadow.camera.bottom = -dd;
                key.shadow.bias = -0.0004;
                this.scene.add(key);
                var fill = new THREE.DirectionalLight(0xffffff, 0.35);
                fill.position.set(-4, 2.5, 3);
                this.scene.add(fill);
                return;
            }
            if (this.viewMode === 'sketch') {
                // High ambient, flat look for wireframe blueprints
                const ambient = new THREE.AmbientLight(0xffffff, 0.9);
                this.scene.add(ambient);
                return;
            }

            // Realistic lighting
            const ambient = new THREE.AmbientLight(0xffffff, 0.45);
            this.scene.add(ambient);

            // Key Light
            const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
            keyLight.position.set(4, 7, 5);
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.width = 1024;
            keyLight.shadow.mapSize.height = 1024;
            keyLight.shadow.camera.near = 0.5;
            keyLight.shadow.camera.far = 15;
            const d = 3.5;
            keyLight.shadow.camera.left = -d;
            keyLight.shadow.camera.right = d;
            keyLight.shadow.camera.top = d;
            keyLight.shadow.camera.bottom = -d;
            keyLight.shadow.bias = -0.0005;
            this.scene.add(keyLight);

            // Fill light: Beautiful cyan/blue technical accent glow
            const fillLight = new THREE.DirectionalLight(0x2563eb, 0.4);
            fillLight.position.set(-6, 3, 2);
            this.scene.add(fillLight);

            // Rim light: soft orange glow to highlight details
            const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.2);
            rimLight.position.set(0, -3, -5);
            this.scene.add(rimLight);

            // Soft highlight spotlight above the collector area
            if (this.lightingEnabled) {
                const spot = new THREE.SpotLight(0xffffff, 0.35, 8, Math.PI / 4, 0.5, 1);
                spot.position.set(0.6, 2.5, 1);
                spot.target.position.set(0.6, 0.8, 0);
                this.scene.add(spot);
                this.scene.add(spot.target);
            }
        },

        buildEnvironment: function () {
            const isRealistic = this.viewMode === 'realistic';
            // Для листа — светлое помещение: пол и стена почти белые, сетки нет.
            const wallColor = this._snap ? 0xdde3ea : (isRealistic ? 0x1e293b : 0x020617);
            const floorColor = this._snap ? 0xc4ccd5 : (isRealistic ? 0x0f172a : 0x020617);

            // Room Floor
            const floorGeo = new THREE.PlaneGeometry(this.layout.wallW, this.layout.floorD);
            const floorMat = new THREE.MeshStandardMaterial({
                color: floorColor,
                roughness: 0.85,
                metalness: 0.1
            });
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.userData.env = true;
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0, this.layout.floorD / 2);
            floor.receiveShadow = true;
            this.scene.add(floor);

            // Room Wall
            const wallGeo = new THREE.PlaneGeometry(this.layout.wallW, this.layout.wallH);
            const wallMat = new THREE.MeshStandardMaterial({
                color: wallColor,
                roughness: 0.9,
                metalness: 0.05
            });
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.userData.env = true;
            wall.position.set(0, this.layout.wallH / 2, 0);
            wall.receiveShadow = true;
            this.scene.add(wall);

            // Floor & Wall Grid lines
            if (this._snap) {
                // плинтус вдоль стены — линия, за которую цепляется глаз
                const plinth = new THREE.Mesh(
                    new THREE.BoxGeometry(this.layout.wallW, 0.08, 0.02),
                    new THREE.MeshStandardMaterial({ color: 0xd7dbe0, roughness: 0.8 }));
                plinth.userData.env = true;
                plinth.position.set(0, 0.04, 0.012);
                this.scene.add(plinth);
            } else if (isRealistic) {
                const gridFloor = new THREE.GridHelper(this.layout.wallW, 20, 0x475569, 0x334155);
                gridFloor.position.set(0, 0.002, this.layout.floorD / 2);
                this.scene.add(gridFloor);
            } else {
                // Sketch mode neon cyan grids
                const gridFloor = new THREE.GridHelper(this.layout.wallW, 16, 0x06b6d4, 0x0891b2);
                gridFloor.position.set(0, 0.002, this.layout.floorD / 2);
                this.scene.add(gridFloor);

                const gridWall = new THREE.GridHelper(this.layout.wallW, 16, 0x06b6d4, 0x0891b2);
                gridWall.rotation.x = Math.PI / 2;
                gridWall.position.set(0, this.layout.wallH / 2, 0.002);
                this.scene.add(gridWall);
            }
        },

        // Material Factory
        getMaterial: function (colorHex, roughness = 0.3, metalness = 0.2, emissive = 0x000000, transparent = false, opacity = 1.0) {
            if (this.viewMode === 'sketch') {
                return new THREE.MeshBasicMaterial({
                    color: 0x06b6d4,
                    wireframe: true
                });
            }
            return new THREE.MeshStandardMaterial({
                color: colorHex,
                roughness: roughness,
                metalness: metalness,
                emissive: emissive,
                transparent: transparent,
                opacity: opacity
            });
        },

        buildBoilerRoom: function (equipmentList, state) {
            this.pipes = [];

            // 1. Parse equipment items
            let items = {
                boilerGas: null,
                boilerEl: null,
                boilerGbm: null,
                boilerSolid: null,
                waterHeater: null,
                hydroSeparator: null,
                manifold: null,
                pumpGroups: [],
                tanksHeating: [],
                tanksGvs: [],
                filters: []
            };

            equipmentList.forEach(item => {
                const name = item.name.toLowerCase();
                const sku = (item.displaySku || "").toLowerCase();
                
                // Identify item categories
                // ГБМ котла POLIS проверяем первой: в её названии есть и «кот» («обвязка
                // котла»), и «груп», поэтому иначе она уехала бы либо в котлы, либо в ряд
                // насосных групп коллектора — а она стоит на котловом контуре. Если POLIS
                // обвязан россыпью (кранами), узла под котлом нет — и рисовать нечего.
                if (name.includes("быстрого монтажа")) {
                    items.boilerGbm = item;
                } else if (name.includes("газов") && name.includes("кот")) {
                    items.boilerGas = item;
                } else if (name.includes("электр") && name.includes("кот")) {
                    items.boilerEl = item;
                } else if ((name.includes("твердо") || name.includes("уголь") || name.includes("дров")) && name.includes("кот")) {
                    items.boilerSolid = item;
                } else if (name.includes("кот") && !items.boilerGas && !items.boilerEl && !items.boilerSolid) {
                    // Default to gas if unspecified
                    items.boilerGas = item;
                } else if (name.includes("водонагрев") || name.includes("бойлер")) {
                    items.waterHeater = item;
                } else if (name.includes("разделител") || name.includes("стрелка") || name.includes("гидрострел")) {
                    items.hydroSeparator = item;
                } else if (name.includes("коллектор") && !name.includes("тепл") && !name.includes("радиатор")) {
                    items.manifold = item;
                } else if (name.includes("насосн") && (name.includes("груп") || name.includes("быстр"))) {
                    items.pumpGroups.push(item);
                } else if (name.includes("бак") && (name.includes("расшир") || name.includes("мембр"))) {
                    if (name.includes("гвс") || name.includes("водосн") || name.includes("бойлер") || name.includes("хвс") || sku.includes("w")) {
                        items.tanksGvs.push(item);
                    } else {
                        items.tanksHeating.push(item);
                    }
                } else if (name.includes("фильтр") || name.includes("водоочист")) {
                    items.filters.push(item);
                }
            });

            // 2. Build Boiler Room Assets
            
            // WATER HEATER (Бойлер ГВС)
            if (items.waterHeater || state.hotWater) {
                const whData = items.waterHeater || { name: "Водонагреватель Stout", displaySku: "SWH-0010", brand: "STOUT", q: 1, unit: "шт" };
                this.loadModelOrFallback(whData, this.layout.waterHeater, () => {
                    this.drawCylinderTank(this.layout.waterHeater, 0xffffff, whData);
                });
                
                // GVS expansion tank connected/placed next to it
                if (items.tanksGvs.length > 0 || state.recirc) {
                    const tankData = items.tanksGvs[0] || { name: "Бак расширительный ГВС", displaySku: "STH-GVS", brand: "STOUT", q: 1, unit: "шт" };
                    this.loadModelOrFallback(tankData, this.layout.tankGvs, () => {
                        this.drawExpansionTank(this.layout.tankGvs, 0x2563eb, tankData); // Blue GVS tank
                    });
                }
            }

            // SOLID FUEL BOILER
            if (items.boilerSolid) {
                this.loadModelOrFallback(items.boilerSolid, this.layout.boilerSolid, () => {
                    this.drawSolidFuelBoiler(this.layout.boilerSolid, items.boilerSolid);
                });
            }

            // GAS BOILER
            if (items.boilerGas || state.fuels.includes('gas') || state.fuels.includes('wood')) {
                const bData = items.boilerGas || { name: "Газовый настенный котёл Stout", displaySku: "SEB-Gas", brand: "STOUT", q: 1, unit: "шт" };
                this.loadModelOrFallback(bData, this.layout.boilerGas, () => {
                    this.drawWallBoiler(this.layout.boilerGas, 0xf8fafc, true, bData);
                });
            }

            // ELECTRIC BOILER
            if (items.boilerEl || state.fuels.includes('el')) {
                const bData = items.boilerEl || { name: "Электрический котёл Stout", displaySku: "SEB-0009", brand: "STOUT", q: 1, unit: "шт" };
                this.loadModelOrFallback(bData, this.layout.boilerEl, () => {
                    this.drawWallBoiler(this.layout.boilerEl, 0xe2e8f0, false, bData);
                });

                // ГБМ котла POLIS: рисуется тем же узлом, что и насосные группы
                // коллектора — это она и есть, только на котловом контуре.
                if (items.boilerGbm) {
                    const gPos = Object.assign({}, this.layout.boilerGbm, {
                        label: items.boilerGbm.name || this.layout.boilerGbm.label
                    });
                    this.loadModelOrFallback(items.boilerGbm, gPos, () => {
                        this.drawPumpGroup(gPos, items.boilerGbm, 0);
                    });
                }
            }

            // HYDRAULIC SEPARATOR & MANIFOLD
            let hasSeparator = !!items.hydroSeparator || state.hydroType === 'combo' || state.hydroArrowType === 'standard';
            let manifoldX = this.layout.manifold.x;
            
            if (hasSeparator) {
                const sepData = items.hydroSeparator || { name: "Гидравлический разделитель", displaySku: "SDG-0015", brand: "STOUT", q: 1, unit: "шт" };
                this.loadModelOrFallback(sepData, this.layout.hydroSeparator, () => {
                    this.drawHydroSeparator(this.layout.hydroSeparator, sepData);
                });
            }

            // MANIFOLD (Распределительный коллектор)
            const manData = items.manifold || { name: "Распределительный коллектор", displaySku: "SDG-0016", brand: "STOUT", q: 1, unit: "шт" };
            this.loadModelOrFallback(manData, this.layout.manifold, () => {
                this.drawManifold(this.layout.manifold, manData);
            });

            // PUMP GROUPS
            let groupsToDraw = items.pumpGroups;
            if (groupsToDraw.length === 0) {
                // Mock groups based on state if none calculated yet to populate visual space
                const mockCount = state.systems.length || 2;
                for (let i = 0; i < mockCount; i++) {
                    groupsToDraw.push({
                        name: i === 0 ? "Насосная группа прямая" : "Насосная группа с термостатическим смесителем",
                        displaySku: "SDG-0020-0" + (i + 1),
                        brand: "STOUT",
                        q: 1,
                        unit: "шт"
                    });
                }
            }

            groupsToDraw.forEach((item, idx) => {
                const xPos = this.layout.pumpGroupStart.x + idx * this.layout.pumpGroupOffset;
                const pos = {
                    x: xPos,
                    y: this.layout.pumpGroupStart.y,
                    z: this.layout.pumpGroupStart.z,
                    w: this.layout.pumpGroupSize.w,
                    h: this.layout.pumpGroupSize.h,
                    d: this.layout.pumpGroupSize.d,
                    label: "Насосная группа №" + (idx + 1)
                };
                this.loadModelOrFallback(item, pos, () => {
                    this.drawPumpGroup(pos, item, idx);
                });
            });

            // HEATING EXPANSION TANK
            if (items.tanksHeating.length > 0 || state.systems.length > 0) {
                const tankData = items.tanksHeating[0] || { name: "Расширительный мембранный бак Stout", displaySku: "STH-0002", brand: "STOUT", q: 1, unit: "шт" };
                this.loadModelOrFallback(tankData, this.layout.tankHeating, () => {
                    this.drawExpansionTank(this.layout.tankHeating, 0xd97706, tankData); // Red heating tank
                });
            }

            // WATER FILTERS
            if (items.filters.length > 0 || state.bigBlueFilter) {
                const fData = items.filters[0] || { name: "Магистральный фильтр Big Blue 10", displaySku: "SFF-0010", brand: "STOUT", q: 1, unit: "шт" };
                this.loadModelOrFallback(fData, this.layout.filter, () => {
                    this.drawFilter(this.layout.filter, fData);
                });
            }

            // PIPING NETWORK (Соединительные трубы)
            this.drawPiping(items, state);

            // Update stats panel overlay
            const totalElements = equipmentList.reduce((sum, item) => sum + item.q, 0);
            const statsEl = document.getElementById('b3d_stats_count');
            if (statsEl) statsEl.textContent = totalElements;
        },

        // --- DRAWING UTILITIES ---

        registerInteractive: function (mesh, itemData) {
            // Save data for raycast hovers
            mesh.userData = { item: itemData };
            
            // Enable shadows
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            
            this.interactiveObjects.push(mesh);
        },

        drawWallBoiler: function (pos, bodyColor, isGas, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Boiler main casing
            const casingGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const casingMat = this.getMaterial(bodyColor, 0.25, 0.1);
            const casing = new THREE.Mesh(casingGeo, casingMat);
            group.add(casing);

            if (this.viewMode === 'realistic') {
                // Glossy dark faceplate panel
                const fpGeo = new THREE.BoxGeometry(pos.w * 0.9, pos.h * 0.2, 0.01);
                const fpMat = this.getMaterial(0x1e293b, 0.15, 0.4);
                const fp = new THREE.Mesh(fpGeo, fpMat);
                fp.position.set(0, -pos.h * 0.3, pos.d / 2 + 0.005);
                group.add(fp);

                // LCD Screen glowing
                const scrGeo = new THREE.PlaneGeometry(pos.w * 0.25, pos.h * 0.08);
                const scrMat = this.getMaterial(0x0284c7, 0.1, 0.1, 0x0284c7); // Glowing cyan LCD
                const scr = new THREE.Mesh(scrGeo, scrMat);
                scr.position.set(-pos.w * 0.2, -pos.h * 0.3, pos.d / 2 + 0.012);
                group.add(scr);

                // LED lights
                const ledGeo = new THREE.SphereGeometry(0.008, 8, 8);
                const ledGreen = new THREE.Mesh(ledGeo, this.getMaterial(0x22c55e, 0.1, 0.1, 0x22c55e));
                ledGreen.position.set(pos.w * 0.15, -pos.h * 0.3, pos.d / 2 + 0.012);
                group.add(ledGreen);

                const ledRed = new THREE.Mesh(ledGeo, this.getMaterial(0xef4444, 0.1, 0.1));
                ledRed.position.set(pos.w * 0.23, -pos.h * 0.3, pos.d / 2 + 0.012);
                group.add(ledRed);

                // Chimney on top
                const chimGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16);
                const chimMat = this.getMaterial(0xe2e8f0, 0.3, 0.1);
                const chimney = new THREE.Mesh(chimGeo, chimMat);
                chimney.position.set(0, pos.h / 2 + 0.2, 0);
                group.add(chimney);

                if (isGas) {
                    // Small glowing flame indicator on screen
                    const flGeo = new THREE.SphereGeometry(0.006, 8, 8);
                    const flMat = this.getMaterial(0xf59e0b, 0.1, 0.1, 0xf59e0b); // Orange fire glow
                    const flame = new THREE.Mesh(flGeo, flMat);
                    flame.position.set(-pos.w * 0.2, -pos.h * 0.3, pos.d / 2 + 0.014);
                    group.add(flame);
                }
            }

            // Register grouping as interactive
            this.registerInteractive(casing, itemData);
            this.scene.add(group);
        },

        drawSolidFuelBoiler: function (pos, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Main box
            const bodyGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const bodyMat = this.getMaterial(0x334155, 0.5, 0.4); // Dark textured metal
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            if (this.viewMode === 'realistic') {
                // Fire doors
                const doorGeo = new THREE.BoxGeometry(pos.w * 0.8, pos.h * 0.28, 0.04);
                const doorMat = this.getMaterial(0x1e293b, 0.3, 0.6);
                
                const upperDoor = new THREE.Mesh(doorGeo, doorMat);
                upperDoor.position.set(0, pos.h * 0.2, pos.d / 2 + 0.02);
                group.add(upperDoor);

                const lowerDoor = new THREE.Mesh(doorGeo, doorMat);
                lowerDoor.position.set(0, -pos.h * 0.2, pos.d / 2 + 0.02);
                group.add(lowerDoor);

                // Silver Handles
                const hGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8);
                const hMat = this.getMaterial(0xcbd5e1, 0.1, 0.8); // Chrome
                
                const h1 = new THREE.Mesh(hGeo, hMat);
                h1.rotation.z = Math.PI / 3;
                h1.position.set(pos.w * 0.3, pos.h * 0.2, pos.d / 2 + 0.05);
                group.add(h1);

                const h2 = new THREE.Mesh(hGeo, hMat);
                h2.rotation.z = Math.PI / 3;
                h2.position.set(pos.w * 0.3, -pos.h * 0.2, pos.d / 2 + 0.05);
                group.add(h2);

                // Flue pipe output at back
                const flueGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
                flueGeo.rotateX(Math.PI / 2);
                const flue = new THREE.Mesh(flueGeo, this.getMaterial(0x475569, 0.4, 0.5));
                flue.position.set(0, pos.h * 0.3, -pos.d / 2 - 0.15);
                group.add(flue);
            }

            this.registerInteractive(body, itemData);
            this.scene.add(group);
        },

        drawCylinderTank: function (pos, colorHex, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Cylinder body
            const bodyGeo = new THREE.CylinderGeometry(pos.w / 2, pos.w / 2, pos.h, 24);
            const bodyMat = this.getMaterial(colorHex, 0.2, 0.15);
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            if (this.viewMode === 'realistic') {
                // Rounded dome top
                const domeGeo = new THREE.SphereGeometry(pos.w / 2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
                const dome = new THREE.Mesh(domeGeo, bodyMat);
                dome.position.set(0, pos.h / 2, 0);
                group.add(dome);

                // Circular temp dial indicator on the front
                const dialGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16);
                dialGeo.rotateX(Math.PI / 2);
                const dialMat = this.getMaterial(0xf1f5f9, 0.1, 0.5);
                const dial = new THREE.Mesh(dialGeo, dialMat);
                dial.position.set(0, pos.h * 0.25, pos.w / 2 + 0.005);
                group.add(dial);
                
                // Red/Blue connection stickers on dial
                const needleGeo = new THREE.BoxGeometry(0.004, 0.03, 0.002);
                const needleMat = this.getMaterial(0xef4444, 0.2, 0.1);
                const needle = new THREE.Mesh(needleGeo, needleMat);
                needle.position.set(0, pos.h * 0.25, pos.w / 2 + 0.012);
                needle.rotation.z = -Math.PI / 4;
                group.add(needle);
            }

            this.registerInteractive(body, itemData);
            this.scene.add(group);
            return group;
        },

        drawExpansionTank: function (pos, colorHex, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Spherical/cylindrical expansion tank
            const bodyGeo = new THREE.CylinderGeometry(pos.r, pos.r, pos.h * 0.7, 16);
            const bodyMat = this.getMaterial(colorHex, 0.25, 0.2);
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            if (this.viewMode === 'realistic') {
                // Hemispheres on top and bottom
                const domeGeo = new THREE.SphereGeometry(pos.r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
                
                const topDome = new THREE.Mesh(domeGeo, bodyMat);
                topDome.position.set(0, pos.h * 0.35, 0);
                group.add(topDome);

                const botDome = new THREE.Mesh(domeGeo, bodyMat);
                botDome.rotation.x = Math.PI;
                botDome.position.set(0, -pos.h * 0.35, 0);
                group.add(botDome);

                // Small wall mounting bracket or legs
                const brackGeo = new THREE.BoxGeometry(pos.r * 0.4, 0.1, pos.r + 0.15);
                const brackMat = this.getMaterial(0x334155, 0.4, 0.7); // Dark metal
                const bracket = new THREE.Mesh(brackGeo, brackMat);
                bracket.position.set(0, 0, -pos.r / 2 - 0.075);
                group.add(bracket);
            }

            this.registerInteractive(body, itemData);
            this.scene.add(group);
        },

        drawHydroSeparator: function (pos, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Vertical insulated separator bar
            const bodyGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const bodyMat = this.getMaterial(0x1e293b, 0.8, 0.1); // Black foam insulation
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            if (this.viewMode === 'realistic') {
                // Red and blue stripe clips
                const ringGeo = new THREE.BoxGeometry(pos.w + 0.005, 0.03, pos.d + 0.005);
                
                const supplyRing = new THREE.Mesh(ringGeo, this.getMaterial(0xef4444, 0.3, 0.1));
                supplyRing.position.set(0, pos.h * 0.3, 0);
                group.add(supplyRing);

                const returnRing = new THREE.Mesh(ringGeo, this.getMaterial(0x2563eb, 0.3, 0.1));
                returnRing.position.set(0, -pos.h * 0.3, 0);
                group.add(returnRing);

                // Pressure gauge on top
                const gaugeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 12);
                gaugeGeo.rotateX(Math.PI / 2);
                const gauge = new THREE.Mesh(gaugeGeo, this.getMaterial(0xf8fafc, 0.2, 0.7));
                gauge.position.set(0, pos.h / 2 + 0.06, 0);
                group.add(gauge);
            }

            this.registerInteractive(body, itemData);
            this.scene.add(group);
        },

        drawManifold: function (pos, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Horizontal insulated manifold block
            const bodyGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const bodyMat = this.getMaterial(0x111827, 0.85, 0.1); // Charcoal foam insulation
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            if (this.viewMode === 'realistic') {
                // Center stripe: Red supply half, blue return half
                const stripeGeo = new THREE.BoxGeometry(pos.w * 0.95, 0.015, pos.d + 0.005);
                
                const stripeRed = new THREE.Mesh(stripeGeo, this.getMaterial(0xef4444, 0.3, 0.1));
                stripeRed.position.set(0, 0.03, 0);
                group.add(stripeRed);

                const stripeBlue = new THREE.Mesh(stripeGeo, this.getMaterial(0x2563eb, 0.3, 0.1));
                stripeBlue.position.set(0, -0.03, 0);
                group.add(stripeBlue);
            }

            this.registerInteractive(body, itemData);
            this.scene.add(group);
        },

        drawPumpGroup: function (pos, itemData, idx) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Insulated protective casing
            const casingGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            const casingMat = this.getMaterial(0x1e293b, 0.8, 0.2); // Matte black casing
            const casing = new THREE.Mesh(casingGeo, casingMat);
            group.add(casing);

            if (this.viewMode === 'realistic') {
                // Round thermometer dials on face (Red = left supply, Blue = right return)
                const dialGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16);
                dialGeo.rotateX(Math.PI / 2);
                
                const tRed = new THREE.Mesh(dialGeo, this.getMaterial(0xef4444, 0.2, 0.6));
                tRed.position.set(-pos.w * 0.22, pos.h * 0.25, pos.d / 2 + 0.005);
                group.add(tRed);

                const tBlue = new THREE.Mesh(dialGeo, this.getMaterial(0x2563eb, 0.2, 0.6));
                tBlue.position.set(pos.w * 0.22, pos.h * 0.25, pos.d / 2 + 0.005);
                group.add(tBlue);

                // Small glass lens covers for thermometers
                const lensGeo = new THREE.CylinderGeometry(0.041, 0.041, 0.005, 16);
                lensGeo.rotateX(Math.PI / 2);
                const glassMat = this.getMaterial(0xffffff, 0.05, 0.95, 0x000000, true, 0.3); // Transparent shiny plastic
                
                const lensRed = new THREE.Mesh(lensGeo, glassMat);
                lensRed.position.set(-pos.w * 0.22, pos.h * 0.25, pos.d / 2 + 0.01);
                group.add(lensRed);

                const lensBlue = new THREE.Mesh(lensGeo, glassMat);
                lensBlue.position.set(pos.w * 0.22, pos.h * 0.25, pos.d / 2 + 0.01);
                group.add(lensBlue);

                // Circulation Pump motor block visible in cutout (represented by a green/red cylinder)
                const pumpColor = itemData.brand === 'ROMMER' ? 0xef4444 : 0x10b981; // Rommer = Red, Stout = Green
                const pumpGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12);
                const pumpMat = this.getMaterial(pumpColor, 0.3, 0.5);
                const pump = new THREE.Mesh(pumpGeo, pumpMat);
                pump.position.set(-pos.w * 0.22, -pos.h * 0.15, pos.d / 2 - 0.02);
                group.add(pump);
            }

            this.registerInteractive(casing, itemData);
            this.scene.add(group);
        },

        drawFilter: function (pos, itemData) {
            const group = new THREE.Group();
            group.position.set(pos.x, pos.y, pos.z);

            // Blue filter housing (Big Blue cylinder)
            const housingGeo = new THREE.CylinderGeometry(pos.w / 2, pos.w / 2, pos.h * 0.8, 16);
            const housingMat = this.getMaterial(0x1d4ed8, 0.3, 0.1); // Royal blue plastic
            const housing = new THREE.Mesh(housingGeo, housingMat);
            group.add(housing);

            if (this.viewMode === 'realistic') {
                // Black plastic head cap on top
                const capGeo = new THREE.CylinderGeometry(pos.w * 0.55, pos.w * 0.55, pos.h * 0.2, 16);
                const capMat = this.getMaterial(0x111827, 0.6, 0.1);
                const cap = new THREE.Mesh(capGeo, capMat);
                cap.position.set(0, pos.h * 0.45, 0);
                group.add(cap);

                // Small pressure release valve on top
                const valveGeo = new THREE.SphereGeometry(0.015, 8, 8);
                const valveMat = this.getMaterial(0xef4444, 0.4, 0.1); // Red valve button
                const valve = new THREE.Mesh(valveGeo, valveMat);
                valve.position.set(0, pos.h * 0.55, 0);
                group.add(valve);
            }

            this.registerInteractive(housing, itemData);
            this.scene.add(group);
        },

        // Procedural pipe segments
        drawPipeSegment: function (p1, p2, radius, colorHex, flowDir = null) {
            if (this.viewMode === 'sketch') {
                // In sketch mode, we draw neon glow lines instead of thick 3D pipes
                const points = [new THREE.Vector3(p1.x, p1.y, p1.z), new THREE.Vector3(p2.x, p2.y, p2.z)];
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({
                    color: colorHex === 0xef4444 ? 0xec4899 : 0x06b6d4, // hot pink / bright cyan neon
                    linewidth: 2
                });
                const line = new THREE.Line(lineGeo, lineMat);
                this.scene.add(line);
                return;
            }

            const distance = Math.sqrt(
                Math.pow(p2.x - p1.x, 2) +
                Math.pow(p2.y - p1.y, 2) +
                Math.pow(p2.z - p1.z, 2)
            );

            const pipeGeo = new THREE.CylinderGeometry(radius, radius, distance, 12);
            
            // Align pipe to segment direction vector
            const position = new THREE.Vector3(
                (p1.x + p2.x) / 2,
                (p1.y + p2.y) / 2,
                (p1.z + p2.z) / 2
            );

            const pipeMat = this.getMaterial(colorHex, 0.2, 0.65); // Semi-glossy metallic pipes
            const pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.position.copy(position);

            const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
            const alignVector = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(alignVector, direction);
            pipe.setRotationFromQuaternion(quaternion);

            pipe.castShadow = true;
            pipe.receiveShadow = true;
            this.scene.add(pipe);

            // Flow lights animation logic
            if (this.flowAnimated && flowDir) {
                this.pipes.push({
                    p1: p1.clone(),
                    p2: p2.clone(),
                    dir: direction.clone(),
                    length: distance,
                    color: colorHex
                });
            }
        },

        drawPiping: function (items, state) {
            const r = 0.02; // Pipe radius
            const cRed = 0xd97706; // Supply (Warm gold / orange-red)
            const cBlue = 0x2563eb; // Return (Clean blue)
            const cGrey = 0x64748b; // Sanitary/GVS grey

            // Determine boiler exit point
            let bExitX = this.layout.boilerGas.x;
            let bExitZ = this.layout.boilerGas.z - 0.02;
            let bExitY = 1.3;
            if (!items.boilerGas && items.boilerEl) {
                bExitX = this.layout.boilerEl.x;
                bExitZ = this.layout.boilerEl.z - 0.02;

                // POLIS: между котлом и разводкой стоит ГБМ. Рисуем переходные муфты
                // от патрубков котла к группе, а дальше контур идёт уже от её низа —
                // иначе трубы прошли бы сквозь корпус группы.
                if (items.boilerGbm) {
                    const g = this.layout.boilerGbm;
                    const bBottom = this.layout.boilerEl.y - this.layout.boilerEl.h / 2;
                    const gTop = g.y + g.h / 2, gBot = g.y - g.h / 2;
                    this.drawPipeSegment(
                        new THREE.Vector3(bExitX - 0.1, bBottom, bExitZ),
                        new THREE.Vector3(bExitX - 0.1, gTop, bExitZ), r, cRed, true);
                    this.drawPipeSegment(
                        new THREE.Vector3(bExitX + 0.1, bBottom, bExitZ),
                        new THREE.Vector3(bExitX + 0.1, gTop, bExitZ), r, cBlue, true);
                    bExitY = gBot;
                }
            }

            // Separator inlets
            let sepInX = this.layout.hydroSeparator.x;
            let sepInY = this.layout.hydroSeparator.y;
            let sepInZ = this.layout.hydroSeparator.z;

            // Boiler to Separator loops (Supply & Return)
            if (state.hydroType === 'combo' || state.hydroArrowType === 'standard' || items.hydroSeparator) {
                // Hot Supply: Boiler bottom to Separator top
                const supply1 = new THREE.Vector3(bExitX - 0.1, bExitY, bExitZ);
                const supply2 = new THREE.Vector3(bExitX - 0.1, sepInY + 0.2, sepInZ);
                const supply3 = new THREE.Vector3(sepInX - 0.03, sepInY + 0.2, sepInZ);
                
                this.drawPipeSegment(supply1, supply2, r, cRed, true);
                this.drawPipeSegment(supply2, supply3, r, cRed, true);

                // Cold Return: Separator bottom to Boiler bottom
                const return1 = new THREE.Vector3(sepInX - 0.03, sepInY - 0.2, sepInZ);
                const return2 = new THREE.Vector3(bExitX + 0.1, sepInY - 0.2, bExitZ);
                const return3 = new THREE.Vector3(bExitX + 0.1, bExitY, bExitZ);
                
                this.drawPipeSegment(return1, return2, r, cBlue, true);
                this.drawPipeSegment(return2, return3, r, cBlue, true);
            }

            // Boiler to Water Heater lines
            if (state.hotWater || items.waterHeater) {
                let whX = this.layout.waterHeater.x;
                let whY = this.layout.waterHeater.y;
                let whZ = this.layout.waterHeater.z;

                // GVS lines running to wall
                const coldIn1 = new THREE.Vector3(whX, 0.2, whZ);
                const coldIn2 = new THREE.Vector3(whX, 0.2, 0.05);
                const coldIn3 = new THREE.Vector3(-2.4, 0.2, 0.05); // Outside to left
                this.drawPipeSegment(coldIn1, coldIn2, r, cBlue, true);
                this.drawPipeSegment(coldIn2, coldIn3, r, cBlue, true);

                const hotOut1 = new THREE.Vector3(whX + 0.15, whY + 0.6, whZ);
                const hotOut2 = new THREE.Vector3(whX + 0.15, whY + 0.6, 0.05);
                const hotOut3 = new THREE.Vector3(-2.4, whY + 0.6, 0.05);
                this.drawPipeSegment(hotOut1, hotOut2, r, cRed, true);
                this.drawPipeSegment(hotOut2, hotOut3, r, cRed, true);
            }

            // Pump groups inputs from manifold
            let manX = this.layout.manifold.x;
            let manY = this.layout.manifold.y;
            let manZ = this.layout.manifold.z;

            // Draw pipes from manifold nozzles into pump groups
            let groupsCount = items.pumpGroups.length || state.systems.length || 2;
            for (let i = 0; i < groupsCount; i++) {
                const groupX = this.layout.pumpGroupStart.x + i * this.layout.pumpGroupOffset;
                const groupY = this.layout.pumpGroupStart.y;
                const groupZ = this.layout.pumpGroupStart.z;

                // Hot Supply Connection (Left nozzle of group)
                const s1 = new THREE.Vector3(groupX - 0.05, groupY - 0.2, groupZ);
                const s2 = new THREE.Vector3(groupX - 0.05, manY + 0.08, manZ);
                this.drawPipeSegment(s1, s2, r * 0.8, cRed, true);

                // Cold Return Connection (Right nozzle of group)
                const ret1 = new THREE.Vector3(groupX + 0.05, groupY - 0.2, groupZ);
                const ret2 = new THREE.Vector3(groupX + 0.05, manY + 0.08, manZ);
                this.drawPipeSegment(ret1, ret2, r * 0.8, cBlue, true);

                // Pipes extending from pump group up into ceiling (heating outputs)
                const sUp1 = new THREE.Vector3(groupX - 0.05, groupY + 0.2, groupZ);
                const sUp2 = new THREE.Vector3(groupX - 0.05, 2.5, groupZ);
                this.drawPipeSegment(sUp1, sUp2, r, cRed, true);

                const retUp1 = new THREE.Vector3(groupX + 0.05, groupY + 0.2, groupZ);
                const retUp2 = new THREE.Vector3(groupX + 0.05, 2.5, groupZ);
                this.drawPipeSegment(retUp1, retUp2, r, cBlue, true);
            }

            // Separator to Manifold bridge
            if (state.hydroType === 'combo' || state.hydroArrowType === 'standard' || items.hydroSeparator) {
                // Horizontals connecting separator side outputs to manifold side inputs
                const bridgeS1 = new THREE.Vector3(sepInX + 0.05, sepInY + 0.15, sepInZ);
                const bridgeS2 = new THREE.Vector3(manX - 0.6, manY + 0.08, manZ);
                this.drawPipeSegment(bridgeS1, bridgeS2, r * 1.1, cRed, true);

                const bridgeR1 = new THREE.Vector3(sepInX + 0.05, sepInY - 0.15, sepInZ);
                const bridgeR2 = new THREE.Vector3(manX - 0.6, manY - 0.08, manZ);
                this.drawPipeSegment(bridgeR1, bridgeR2, r * 1.1, cBlue, true);
            }
        },

        // --- EVENTS & INTERACTIONS ---

        setupEvents: function () {
            this.onMouseMove = (event) => {
                const rect = this.renderer.domElement.getBoundingClientRect();
                this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            };

            this.onCanvasClick = (event) => {
                // Focus camera target on clicked item
                if (this.hoveredObject) {
                    const targetPos = new THREE.Vector3();
                    this.hoveredObject.getWorldPosition(targetPos);
                    
                    // Animate camera look-at target
                    new THREE.Vector3();
                    const startTarget = this.controls.target.clone();
                    const duration = 20;
                    let step = 0;
                    
                    const animCameraFocus = () => {
                        if (step < duration) {
                            step++;
                            this.controls.target.lerpVectors(startTarget, targetPos, step / duration);
                            this.controls.update();
                            requestAnimationFrame(animCameraFocus);
                        }
                    };
                    animCameraFocus();
                }
            };

            this.renderer.domElement.addEventListener('pointermove', this.onMouseMove);
            this.renderer.domElement.addEventListener('click', this.onCanvasClick);

            // Responsive resizing
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const width = entry.contentRect.width;
                    const height = entry.contentRect.height;
                    
                    if (this.camera && this.renderer) {
                        this.camera.aspect = width / height;
                        this.camera.updateProjectionMatrix();
                        this.renderer.setSize(width, height);
                    }
                }
            });
            this.resizeObserver.observe(this.container);
        },

        createUIOverlay: function (state) {
            // Stats Panel
            this.uiOverlay = document.createElement('div');
            this.uiOverlay.style.position = 'absolute';
            this.uiOverlay.style.top = '12px';
            this.uiOverlay.style.left = '12px';
            this.uiOverlay.style.background = 'rgba(15, 23, 42, 0.8)';
            this.uiOverlay.style.backdropFilter = 'blur(8px)';
            this.uiOverlay.style.border = '1px solid rgba(148, 163, 184, 0.15)';
            this.uiOverlay.style.borderRadius = '10px';
            this.uiOverlay.style.padding = '12px';
            this.uiOverlay.style.fontFamily = "'Inter', sans-serif";
            this.uiOverlay.style.color = '#e2e8f0';
            this.uiOverlay.style.fontSize = '12px';
            this.uiOverlay.style.pointerEvents = 'auto';
            this.uiOverlay.style.boxShadow = '0 4px 15px rgba(0,0,0,0.4)';
            this.uiOverlay.innerHTML = `
                <div style="font-weight: 800; font-size: 13px; color: #f1f5f9; margin-bottom: 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.15); padding-bottom: 6px; display:flex; align-items:center; gap: 6px;">
                    <span>📐 3D Котельная</span>
                </div>
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <div>Мощность: <strong style="color:#ef4444;">${state.power || 0} кВт</strong></div>
                    <div>Элементов обвязки: <strong id="b3d_stats_count" style="color:#60a5fa;">0</strong> шт.</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 5px; border-top: 1px dashed rgba(148, 163, 184, 0.15); padding-top: 4px;">Зажмите ЛКМ для вращения<br>ПКМ для сдвига, скролл для зума</div>
                </div>
            `;
            this.container.appendChild(this.uiOverlay);

            // Controls Overlay
            const controlsDiv = document.createElement('div');
            controlsDiv.style.position = 'absolute';
            controlsDiv.style.bottom = '12px';
            controlsDiv.style.right = '12px';
            controlsDiv.style.display = 'flex';
            controlsDiv.style.gap = '8px';
            controlsDiv.style.zIndex = '10';

            const btnStyle = "padding: 6px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; border: 1px solid rgba(148,163,184,0.2); background: rgba(30,41,59,0.9); color: #f1f5f9; cursor: pointer; transition: 0.2s;";
            
            controlsDiv.innerHTML = `
                <button id="btn_b3d_reset" style="${btnStyle}">📷 Сбросить камеру</button>
                <button id="btn_b3d_mode" style="${btnStyle}">🎨 Стиль: ${this.viewMode === 'realistic' ? 'Реалистичный' : 'Эскиз'}</button>
            `;
            this.container.appendChild(controlsDiv);

            // Control Actions
            document.getElementById('btn_b3d_reset').addEventListener('click', () => {
                this.camera.position.set(0, 1.8, 4.6);
                this.controls.target.set(0.1, 1.1, 0);
                this.controls.update();
            });

            document.getElementById('btn_b3d_mode').addEventListener('click', () => {
                this.viewMode = this.viewMode === 'realistic' ? 'sketch' : 'realistic';
                document.getElementById('btn_b3d_mode').textContent = `🎨 Стиль: ${this.viewMode === 'realistic' ? 'Реалистичный' : 'Эскиз'}`;
                
                // Re-render scene completely
                this.initAndRender(this.container, state, app.currentEquipmentList);
            });
        },

        animate: function () {
            this.animationFrameId = requestAnimationFrame(() => this.animate());

            // Update orbit controls damping
            if (this.controls) this.controls.update();

            // Run pointer raycasting check
            this.performRaycast();

            // Render flow light pulses
            if (this.viewMode === 'realistic' && this.flowAnimated && this.pipes.length > 0) {
                // Optional: we can draw visual particle highlights along pipe routes
            }

            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        },

        performRaycast: function () {
            if (!this.raycaster || !this.camera || this.interactiveObjects.length === 0) return;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactiveObjects);

            if (intersects.length > 0) {
                const targetMesh = intersects[0].object;
                
                if (this.hoveredObject !== targetMesh) {
                    // Restore previous hovered object material
                    this.resetHoverState();

                    this.hoveredObject = targetMesh;

                    // Backup material settings
                    if (!this.originalMaterials.has(targetMesh)) {
                        this.originalMaterials.set(targetMesh, {
                            emissiveHex: targetMesh.material.emissive ? targetMesh.material.emissive.getHex() : 0,
                            emissiveIntensity: targetMesh.material.emissiveIntensity || 0
                        });
                    }

                    // Highlight: make object glow slightly
                    if (this.viewMode === 'realistic' && targetMesh.material.emissive) {
                        targetMesh.material.emissive.setHex(0x3b82f6); // Emissive blue highlight
                        targetMesh.material.emissiveIntensity = 0.45;
                    }

                    // Display custom HTML tooltip
                    const item = targetMesh.userData.item;
                    if (item) {
                        this.tooltipEl.innerHTML = `
                            <div style="font-weight: 700; font-size: 13px; color:#60a5fa; margin-bottom: 4px;">${item.name}</div>
                            <div style="color: #94a3b8; font-size: 11px;">Артикул: <span style="font-family: monospace;">${item.displaySku || item.sku || 'Н/Д'}</span></div>
                            <div style="color: #94a3b8; font-size: 11px;">Бренд: <strong>${item.brand || 'STOUT'}</strong></div>
                            <div style="margin-top: 6px; font-weight: 700; color:#10b981; font-size: 12px; border-top: 1px solid rgba(148, 163, 184, 0.15); padding-top: 4px;">
                                Количество: ${item.q} ${item.unit || 'шт'}
                            </div>
                        `;
                        this.tooltipEl.style.display = 'block';
                    }
                }

                // Follow pointer position on screen for tooltip
                if (this.tooltipEl) {
                    const rect = this.container.getBoundingClientRect();
                    
                    // Convert mouse coord to client canvas local offset
                    const x = ((this.mouse.x + 1) / 2) * rect.width;
                    const y = (-(this.mouse.y - 1) / 2) * rect.height;
                    
                    // Offset tooltip position from cursor to prevent overlap
                    this.tooltipEl.style.left = (x + 15) + 'px';
                    this.tooltipEl.style.top = (y + 15) + 'px';
                }
            } else {
                this.resetHoverState();
            }
        },

        resetHoverState: function () {
            if (this.hoveredObject) {
                const orig = this.originalMaterials.get(this.hoveredObject);
                if (orig && this.hoveredObject.material) {
                    if (this.hoveredObject.material.emissive) {
                        this.hoveredObject.material.emissive.setHex(orig.emissiveHex);
                    }
                    this.hoveredObject.material.emissiveIntensity = orig.emissiveIntensity;
                }
                this.hoveredObject = null;
                if (this.tooltipEl) this.tooltipEl.style.display = 'none';
            }
        },

        dispose: function () {
            // Cancel animation frame loop
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            // Remove events
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.removeEventListener('pointermove', this.onMouseMove);
                this.renderer.domElement.removeEventListener('click', this.onCanvasClick);
                
                // Remove from DOM
                if (this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
            }

            // Resize observer disconnect
            if (this.resizeObserver && this.container) {
                this.resizeObserver.unobserve(this.container);
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }

            // Remove overlay UI panels
            if (this.uiOverlay && this.uiOverlay.parentNode) {
                this.uiOverlay.parentNode.removeChild(this.uiOverlay);
            }
            if (this.tooltipEl && this.tooltipEl.parentNode) {
                this.tooltipEl.parentNode.removeChild(this.tooltipEl);
            }

            // Clear controls
            if (this.controls) {
                this.controls.dispose();
                this.controls = null;
            }

            // Dispose scene resources
            if (this.scene) {
                this.scene.traverse((obj) => {
                    if (obj.geometry) {
                        obj.geometry.dispose();
                    }
                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => m.dispose());
                        } else {
                            obj.material.dispose();
                        }
                    }
                });
                this.scene = null;
            }

            this.renderer = null;
            this.camera = null;
            this.interactiveObjects = [];
            this.originalMaterials.clear();
        }
    };

    window.Boiler3D = Boiler3D;
})();
