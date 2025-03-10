import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SokobanGame {
    constructor() {
        try {
            console.log('初始化游戏...');
            this.initScene();
            this.setupUI();
            this.setupLights();
            this.setupCamera();
            this.createLevel();
            this.setupControls();
            this.animate();
            console.log('游戏初始化完成');
        } catch (error) {
            console.error('游戏初始化失败:', error);
            alert('游戏初始化失败: ' + error.message);
        }
    }

    initScene() {
        console.log('初始化场景...');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        const container = document.getElementById('game-container');
        if (!container) {
            throw new Error('找不到游戏容器元素');
        }
        container.appendChild(this.renderer.domElement);

        // 初始化视角控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 0, 0);

        // 游戏状态
        this.player = null;
        this.boxes = [];
        this.targets = [];
        this.walls = [];
        this.currentLevel = 0;
        this.moves = 0;
        this.moveHistory = [];
        
        // 关卡设计
        this.levels = [
            // 第一关：简单介绍
            [
                [1, 1, 1, 1, 1],
                [1, 4, 0, 2, 1],
                [1, 0, 3, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1]
            ],
            // 第二关：复杂布局
            [
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 2, 0, 0, 3, 0, 1],
                [1, 0, 0, 1, 1, 0, 0, 1],
                [1, 0, 3, 0, 0, 2, 0, 1],
                [1, 0, 0, 1, 1, 0, 4, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1]
            ]
        ];
        console.log('场景初始化完成');
    }

    setupUI() {
        console.log('设置UI...');
        const ui = document.createElement('div');
        ui.style.position = 'fixed';
        ui.style.top = '20px';
        ui.style.left = '50%';
        ui.style.transform = 'translateX(-50%)';
        ui.style.color = 'white';
        ui.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        ui.style.padding = '10px 20px';
        ui.style.borderRadius = '5px';
        ui.style.textAlign = 'center';
        ui.style.fontFamily = 'Arial, sans-serif';
        ui.style.zIndex = '1000';

        this.levelInfo = document.createElement('div');
        this.levelInfo.textContent = `关卡 ${this.currentLevel + 1}/${this.levels.length}`;
        ui.appendChild(this.levelInfo);

        this.moveInfo = document.createElement('div');
        this.moveInfo.textContent = `步数: ${this.moves}`;
        ui.appendChild(this.moveInfo);

        document.body.appendChild(ui);
        console.log('UI设置完成');
    }

    updateUI() {
        this.levelInfo.textContent = `关卡 ${this.currentLevel + 1}/${this.levels.length}`;
        this.moveInfo.textContent = `步数: ${this.moves}`;
    }

    setupLights() {
        console.log('设置光源...');
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 0);
        this.scene.add(directionalLight);
        console.log('光源设置完成');
    }

    setupCamera() {
        console.log('设置相机...');
        this.camera.position.set(8, 8, 12);
        this.camera.lookAt(0, 0, 0);
        console.log('相机设置完成');
    }

    createLevel() {
        console.log('创建关卡...');
        const level = this.levels[this.currentLevel];
        const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3
        });
        const boxGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const boxMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.5,
            metalness: 0.5
        });
        const targetGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        const targetMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const playerGeometry = new THREE.SphereGeometry(0.4);
        const playerMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            roughness: 0.7,
            metalness: 0.3
        });

        const levelWidth = level[0].length;
        const levelHeight = level.length;
        const offset = {
            x: -(levelWidth - 1) / 2,
            z: -(levelHeight - 1) / 2
        };

        // 创建地板
        const floorGeometry = new THREE.PlaneGeometry(levelWidth + 2, levelHeight + 2);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x404040,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        this.scene.add(floor);

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        for (let z = 0; z < level.length; z++) {
            for (let x = 0; x < level[z].length; x++) {
                const posX = x + offset.x;
                const posZ = z + offset.z;

                switch (level[z][x]) {
                    case 1: // 墙
                        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                        wall.position.set(posX, 0.5, posZ);
                        this.scene.add(wall);
                        this.walls.push(wall);
                        break;
                    case 2: // 目标点
                        const target = new THREE.Mesh(targetGeometry, targetMaterial);
                        target.position.set(posX, 0.01, posZ);
                        target.rotation.x = -Math.PI / 2;
                        this.scene.add(target);
                        this.targets.push({ x: posX, z: posZ });
                        break;
                    case 3: // 箱子
                        const box = new THREE.Mesh(boxGeometry, boxMaterial);
                        box.position.set(posX, 0.45, posZ);
                        this.scene.add(box);
                        this.boxes.push(box);
                        break;
                    case 4: // 玩家
                        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
                        this.player.position.set(posX, 0.4, posZ);
                        this.scene.add(this.player);
                        break;
                }
            }
        }
        console.log('关卡创建完成');
    }

    setupControls() {
        console.log('设置控制...');
        document.addEventListener('keydown', (event) => {
            let moveX = 0;
            let moveZ = 0;

            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                    moveX = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                    moveX = 1;
                    break;
                case 'ArrowUp':
                case 'w':
                    moveZ = -1;
                    break;
                case 'ArrowDown':
                case 's':
                    moveZ = 1;
                    break;
                case 'r':
                    this.resetLevel();
                    return;
                case 'z':
                    this.undoMove();
                    return;
                case 'n':
                    this.nextLevel();
                    return;
                case 'p':
                    this.previousLevel();
                    return;
            }

            if (moveX !== 0 || moveZ !== 0) {
                this.movePlayer(moveX, moveZ);
            }
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        console.log('控制设置完成');
    }

    movePlayer(dx, dz) {
        const newX = this.player.position.x + dx;
        const newZ = this.player.position.z + dz;

        if (this.isWall(newX, newZ)) return;

        const moveState = {
            playerPos: { x: this.player.position.x, z: this.player.position.z },
            boxMoved: null
        };

        const box = this.getBoxAt(newX, newZ);
        if (box) {
            const newBoxX = newX + dx;
            const newBoxZ = newZ + dz;

            if (this.isWall(newBoxX, newBoxZ) || this.getBoxAt(newBoxX, newBoxZ)) return;

            moveState.boxMoved = {
                box: box,
                oldPos: { x: box.position.x, z: box.position.z },
                newPos: { x: newBoxX, z: newBoxZ }
            };

            box.position.x = newBoxX;
            box.position.z = newBoxZ;
        }

        this.player.position.x = newX;
        this.player.position.z = newZ;

        this.moves++;
        this.moveHistory.push(moveState);
        this.updateUI();

        this.checkWin();
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        
        this.player.position.x = lastMove.playerPos.x;
        this.player.position.z = lastMove.playerPos.z;

        if (lastMove.boxMoved) {
            lastMove.boxMoved.box.position.x = lastMove.boxMoved.oldPos.x;
            lastMove.boxMoved.box.position.z = lastMove.boxMoved.oldPos.z;
        }

        this.moves--;
        this.updateUI();
    }

    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            this.resetLevel();
        }
    }

    previousLevel() {
        if (this.currentLevel > 0) {
            this.currentLevel--;
            this.resetLevel();
        }
    }

    isWall(x, z) {
        return this.walls.some(wall => 
            Math.abs(wall.position.x - x) < 0.1 && 
            Math.abs(wall.position.z - z) < 0.1
        );
    }

    getBoxAt(x, z) {
        return this.boxes.find(box => 
            Math.abs(box.position.x - x) < 0.1 && 
            Math.abs(box.position.z - z) < 0.1
        );
    }

    checkWin() {
        const allBoxesOnTarget = this.targets.every(target => 
            this.boxes.some(box => 
                Math.abs(box.position.x - target.x) < 0.1 && 
                Math.abs(box.position.z - target.z) < 0.1
            )
        );

        if (allBoxesOnTarget) {
            setTimeout(() => {
                alert(`恭喜完成第 ${this.currentLevel + 1} 关！\n总步数: ${this.moves}`);
                if (this.currentLevel < this.levels.length - 1) {
                    this.nextLevel();
                } else {
                    alert('恭喜通关！');
                    this.currentLevel = 0;
                    this.resetLevel();
                }
            }, 100);
        }
    }

    resetLevel() {
        console.log('重置关卡...');
        while(this.scene.children.length > 0){ 
            this.scene.remove(this.scene.children[0]); 
        }
        this.boxes = [];
        this.targets = [];
        this.walls = [];
        this.moveHistory = [];
        this.moves = 0;
        
        this.setupLights();
        this.createLevel();
        this.updateUI();
        console.log('关卡重置完成');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.controls) {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// 启动游戏
window.onload = () => {
    console.log('页面加载完成，开始初始化游戏...');
    new SokobanGame();
};