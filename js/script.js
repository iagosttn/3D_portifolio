import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

// Variáveis globais
let scene, camera, renderer;
let car, carModel;
let character, characterModel;
let controls;
let ground;
let mixer;
let clock = new THREE.Clock();
let loadingManager;
let loadingBarElement, loadingBarValue;
let isCharacterInCar = true; // Começa dentro do carro
let activeEntity; // Referência para a entidade atualmente controlada (carro ou personagem)
let buildings = []; // Array para armazenar os edifícios da cidade
let holograms = []; // Array para armazenar os hologramas informativos
let portfolioSections = []; // Array para armazenar as seções do portfólio

// Configurações do carro
const carSettings = {
    speed: 0,
    acceleration: 0.004,
    maxSpeed: 0.07,
    deceleration: 0.0015,
    turnSpeed: 0.05,
    direction: new THREE.Vector3(0, 0, 1),
    velocity: new THREE.Vector3()
};

// Configurações do personagem
const characterSettings = {
    speed: 0,
    acceleration: 0.008,
    maxSpeed: 0.06,
    deceleration: 0.002,
    turnSpeed: 0.08,
    direction: new THREE.Vector3(0, 0, 1),
    velocity: new THREE.Vector3(),
    jumpHeight: 0.5,
    isJumping: false,
    jumpVelocity: 0
};

// Controles
const keysPressed = {};
const INTERACTION_DISTANCE = 2; // Distância máxima para interagir com o carro

// Inicialização
init();

// Função de inicialização
function init() {
    // Configuração do gerenciador de carregamento
    setupLoadingManager();
    
    // Configuração da cena
    setupScene();
    
    // Configuração da câmera
    setupCamera();
    
    // Configuração do renderizador
    setupRenderer();
    
    // Adicionar luzes
    addLights();
    
    // Adicionar chão
    createGround();
    
    // Adicionar elementos do portfólio
    createPortfolioElements();
    
    // Carregar o modelo do carro
    loadCarModel();
    
    // Carregar o modelo do personagem
    loadCharacterModel();
    
    // Configurar controles
    setupControls();
    
    // Iniciar animação
    animate();
    
    // Adicionar event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

// Configuração do gerenciador de carregamento
function setupLoadingManager() {
    loadingBarElement = document.querySelector('.loading-bar');
    loadingBarValue = document.querySelector('.loading-bar-value');
    
    loadingManager = new THREE.LoadingManager(
        // Carregado
        () => {
            setTimeout(() => {
                loadingBarValue.style.transform = '';
                loadingBarElement.style.display = 'none';
            }, 500);
        },
        
        // Progresso
        (itemUrl, itemsLoaded, itemsTotal) => {
            const progressRatio = itemsLoaded / itemsTotal;
            loadingBarValue.style.transform = `scaleX(${progressRatio})`;
        }
    );
}

// Configuração da cena
function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011); // Cor de espaço profundo
    scene.fog = new THREE.Fog(0x000011, 20, 60);
}

// Configuração da câmera
function setupCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
}

// Configuração do renderizador
function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
}

// Adicionar luzes
function addLights() {
    // Luz ambiente (mais escura para ambiente lunar)
    const ambientLight = new THREE.AmbientLight(0xaaaaaa, 0.3);
    scene.add(ambientLight);
    
    // Luz direcional (sol no espaço - mais dura e intensa)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Adicionar estrelas ao fundo
    createStars();
}

// Criar estrelas no céu
function createStars() {
    const starsCount = 1000;
    const starsGeometry = new THREE.BufferGeometry();
    const starsPositions = [];
    
    for (let i = 0; i < starsCount; i++) {
        // Distribuir estrelas em uma esfera ao redor da cena
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 80 + Math.random() * 20;
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        starsPositions.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsPositions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Criar chão (superfície lunar)
function createGround() {
    // Textura do chão (superfície lunar)
    const textureLoader = new THREE.TextureLoader(loadingManager);
    const groundTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25);
    
    // Material do chão
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        map: groundTexture,
        color: 0x888888, // Cor cinza lunar
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Geometria do chão
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Criar elementos lunares (crateras e rochas)
    createLunarElements();
}

// Criar elementos lunares (crateras e rochas)
function createLunarElements() {
    // Criar crateras
    createCraters();
    
    // Criar rochas
    createRocks();
    
    // Criar base espacial
    createSpaceBase();
    
    // Criar bandeira
    createFlag();
}

// Criar crateras na superfície lunar
function createCraters() {
    const craterCount = 40;
    const lunarSize = 45;
    
    for (let i = 0; i < craterCount; i++) {
        // Evitar colocar crateras no centro (onde o jogador começa)
        let x, z;
        do {
            x = (Math.random() - 0.5) * 2 * lunarSize;
            z = (Math.random() - 0.5) * 2 * lunarSize;
        } while (Math.abs(x) < 10 && Math.abs(z) < 10);
        
        // Tamanho aleatório para a cratera
        const radius = Math.random() * 3 + 1;
        const depth = Math.random() * 0.5 + 0.2;
        
        // Criar cratera
        const craterGeometry = new THREE.CircleGeometry(radius, 32);
        const craterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x777777, 
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const crater = new THREE.Mesh(craterGeometry, craterMaterial);
        
        // Posicionar cratera
        crater.position.set(x, 0.01, z);
        crater.rotation.x = -Math.PI / 2;
        crater.receiveShadow = true;
        
        // Adicionar à cena
        scene.add(crater);
        
        // Adicionar borda da cratera
        const rimGeometry = new THREE.TorusGeometry(radius, 0.2, 8, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x999999,
            roughness: 0.8,
            metalness: 0.2
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.set(x, 0.1, z);
        rim.rotation.x = Math.PI / 2;
        rim.castShadow = true;
        rim.receiveShadow = true;
        scene.add(rim);
    }
}

// Criar rochas lunares
function createRocks() {
    const rockCount = 50;
    const lunarSize = 45;
    
    for (let i = 0; i < rockCount; i++) {
        // Evitar colocar rochas no centro (onde o jogador começa)
        let x, z;
        do {
            x = (Math.random() - 0.5) * 2 * lunarSize;
            z = (Math.random() - 0.5) * 2 * lunarSize;
        } while (Math.abs(x) < 10 && Math.abs(z) < 10);
        
        // Tamanho aleatório para a rocha
        const size = Math.random() * 1.5 + 0.5;
        
        // Criar rocha (usando geometria de icosaedro para parecer mais irregular)
        const rockGeometry = new THREE.IcosahedronGeometry(size, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Posicionar rocha
        rock.position.set(x, size / 2, z);
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        // Adicionar à cena
        scene.add(rock);
    }
}

// Criar base espacial
function createSpaceBase() {
    // Módulo principal da base
    const baseGeometry = new THREE.CylinderGeometry(5, 5, 3, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.5,
        metalness: 0.8
    });
    const baseModule = new THREE.Mesh(baseGeometry, baseMaterial);
    baseModule.position.set(-25, 1.5, -25);
    baseModule.castShadow = true;
    baseModule.receiveShadow = true;
    scene.add(baseModule);
    
    // Antenas
    const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        roughness: 0.5,
        metalness: 0.8
    });
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(-25, 5, -25);
    antenna.castShadow = true;
    scene.add(antenna);
    
    // Prato da antena
    const dishGeometry = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dishMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd, 
        roughness: 0.5,
        metalness: 0.8
    });
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(-25, 5, -25);
    dish.rotation.x = Math.PI / 2;
    dish.castShadow = true;
    scene.add(dish);
    
    // Painéis solares
    const panelGeometry = new THREE.BoxGeometry(6, 0.1, 3);
    const panelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2244aa, 
        roughness: 0.5,
        metalness: 0.8
    });
    const panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel1.position.set(-28, 2, -25);
    panel1.castShadow = true;
    panel1.receiveShadow = true;
    scene.add(panel1);
    
    const panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel2.position.set(-22, 2, -25);
    panel2.castShadow = true;
    panel2.receiveShadow = true;
    scene.add(panel2);
}

// Criar bandeira
function createFlag() {
    // Mastro da bandeira
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.5,
        metalness: 0.8
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(25, 1.5, -25);
    pole.castShadow = true;
    scene.add(pole);
    
    // Bandeira
    const flagGeometry = new THREE.PlaneGeometry(2, 1);
    const flagCanvas = document.createElement('canvas');
    const flagContext = flagCanvas.getContext('2d');
    flagCanvas.width = 200;
    flagCanvas.height = 100;
    
    // Desenhar a bandeira do Brasil
    flagContext.fillStyle = '#009c3b';
    flagContext.fillRect(0, 0, 200, 100);
    
    flagContext.beginPath();
    flagContext.moveTo(20, 50);
    flagContext.lineTo(100, 10);
    flagContext.lineTo(180, 50);
    flagContext.lineTo(100, 90);
    flagContext.closePath();
    flagContext.fillStyle = '#ffdf00';
    flagContext.fill();
    
    flagContext.beginPath();
    flagContext.arc(100, 50, 20, 0, Math.PI * 2);
    flagContext.fillStyle = '#002776';
    flagContext.fill();
    
    const flagTexture = new THREE.CanvasTexture(flagCanvas);
    const flagMaterial = new THREE.MeshBasicMaterial({ 
        map: flagTexture, 
        side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(26, 2, -25);
    flag.castShadow = true;
    scene.add(flag);
}

// Criar elementos do portfólio
function createPortfolioElements() {
    // Seção: Sobre Mim
    createPortfolioSection(
        new THREE.Vector3(-35, 0, -35),
        'Sobre Mim',
        0xff0000,
        [
            '👋 Olá! Eu sou Iago Soares',
            '💡 Gosto de explorar novas tecnologias e criar soluções práticas por meio da programação.',
            '🎓 Formado em Desenvolvimento de Sistemas pelo SENAI, com cursos complementares em Python.',
            '💼 Atuando como freelancer, desenvolvendo projetos sob demanda.',
            '🌱 Atualmente aprendendo mais sobre tecnologias modernas de front-end e back-end.'
        ],
        [
            '🎮 Curiosidade: Sou apaixonado por jogos de estratégia',
            '🎸 Toco violão nas horas vagas',
            '🌍 Já visitei 5 países diferentes',
            '📚 Leio pelo menos 2 livros por mês',
            '🍕 Minha comida favorita é pizza'
        ]
    );

    // Seção: Skills
    createPortfolioSection(
        new THREE.Vector3(35, 0, -35),
        'Skills',
        0x00ff00,
        [
            '🛠️ Desenvolvimento de Aplicações',
            'JavaScript, HTML5, CSS, Flutter, React, React Native, Django, Flask, MySQL',
            '🧰 Utilitários: Postman',
            '⚙️ DevOps: Git, GitHub',
            '💻 Ferramentas: VS Code, Adobe XD'
        ],
        [
            '🏆 Vencedor de hackathon local em 2023',
            '🎓 Certificado em desenvolvimento web full-stack',
            '💡 Especialista em otimização de performance',
            '🚀 Experiência com metodologias ágeis'
        ]
    );

    // Seção: GitHub Stats
    createPortfolioSection(
        new THREE.Vector3(35, 0, 35),
        'GitHub Stats',
        0x0000ff,
        [
            "📈 GitHub Stats",
            "Total Stars: 0",
            "Total Commits (2025): 14",
            "Sem contribuições | 1-9 | 10-19 | 20-29 | 30+",
            "Pinned: AgroCitro, Clima-tempo, Jest, Portfolio, Projeto_crud_system_verification_jwt_RESTAP, System_Log"
        ],
        [
            '🔍 Contribuo com projetos open source',
            '📱 Desenvolvi 3 aplicativos móveis',
            '🌐 Mantenho 2 sites em produção',
            '🤝 Colaboro com outros desenvolvedores'
        ]
    );

    // Seção: Contato
    createPortfolioSection(
        new THREE.Vector3(-35, 0, 35),
        'Contato',
        0xffff00,
        [
            '🌐 Onde me encontrar:',
            'LinkedIn: --------------------------',
            'Gmail: iagosantanasoares06@gmail.com',
            'GitHub: https://github.com/iagosttn'
        ],
        [
            '⏱️ Respondo e-mails em até 24 horas',
            '💬 Disponível para freelance e projetos',
            '🤝 Aberto a parcerias e colaborações',
            '📞 Prefiro comunicação por e-mail'
        ]
    );

    // Criar caminho de projetos em círculo ao redor do centro
    const projectCount = 6;
    const radius = 15; // Distância do centro
    const projectsData = [
        {
            name: 'AgroCitro',
            color: 0x4caf50,
            info: [
                'Projeto AgroCitro',
                'HTML',
                'Sistema para gestão agrícola.'
            ],
            details: [
                '🌱 Monitoramento de plantações',
                '📊 Análise de dados de colheita',
                '🔍 Previsão de pragas'
            ]
        },
        {
            name: 'Clima-tempo',
            color: 0x2196f3,
            info: [
                'Projeto Clima-tempo',
                'JavaScript',
                'Consulta e exibição de dados meteorológicos.'
            ],
            details: [
                '🌦️ Previsão para 7 dias',
                '🌍 Cobertura global',
                '📱 Versão mobile disponível'
            ]
        },
        {
            name: 'Jest',
            color: 0xff9800,
            info: [
                'Projeto Jest',
                'JavaScript',
                'Testes automatizados para aplicações JS.'
            ],
            details: [
                '✅ 95% de cobertura de código',
                '🔄 Integração contínua',
                '⚡ Execução rápida de testes'
            ]
        },
        {
            name: 'Portfolio',
            color: 0x9c27b0,
            info: [
                'Projeto Portfolio',
                'HTML',
                'Portfólio pessoal interativo.'
            ],
            details: [
                '🎨 Design responsivo',
                '🌐 Otimizado para SEO',
                '🚀 Carregamento rápido'
            ]
        },
        {
            name: 'Projeto_crud_system_verification_jwt_RESTAP',
            color: 0xf44336,
            info: [
                'CRUD System com JWT',
                'Python',
                'Sistema de autenticação e verificação de usuários.'
            ],
            details: [
                '🔒 Segurança avançada',
                '🔑 Tokens JWT',
                '👤 Gerenciamento de usuários'
            ]
        },
        {
            name: 'System_Log',
            color: 0x607d8b,
            info: [
                'System Log',
                'Python',
                'Sistema de autenticação, login e controle de acesso.'
            ],
            details: [
                '📊 Dashboard de atividades',
                '⚠️ Alertas de segurança',
                '🔍 Rastreamento de ações'
            ]
        }
    ];
    
    // Criar projetos em círculo
    for (let i = 0; i < projectCount; i++) {
        const angle = (i / projectCount) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        const project = projectsData[i];
        createProjectSpot(
            new THREE.Vector3(x, 0, z),
            project.name,
            project.color,
            project.info,
            project.details
        );
    }
    
    // Adicionar curiosidades flutuantes no centro
    createCentralInfoPoint();
}

// Criar ponto de informações central com curiosidades
function createCentralInfoPoint() {
    // Criar plataforma central
    const centerGeometry = new THREE.CylinderGeometry(3, 3, 0.3, 32);
    const centerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.8,
        roughness: 0.2
    });
    const centerPlatform = new THREE.Mesh(centerGeometry, centerMaterial);
    centerPlatform.position.set(0, 0.15, 0);
    centerPlatform.receiveShadow = true;
    centerPlatform.castShadow = true;
    scene.add(centerPlatform);
    
    // Adicionar efeito de luz ao centro
    const centerLight = new THREE.PointLight(0xffffff, 1, 10);
    centerLight.position.set(0, 2, 0);
    scene.add(centerLight);
    
    // Criar holograma central com curiosidades
    const centerPosition = new THREE.Vector3(0, 0, 0);
    createHologram(
        centerPosition,
        "Curiosidades Sobre Mim",
        0xffaa00,
        [
            "🎯 Meu objetivo é me tornar um desenvolvedor full-stack de referência",
            "🎓 Estou sempre estudando novas tecnologias",
            "🌱 Acredito no poder da colaboração e do código aberto",
            "🎮 Desenvolvo jogos como hobby",
            "🚀 Sonho em criar uma startup de tecnologia"
        ],
        true
    );
    
    // Adicionar efeito de partículas ao redor da plataforma
    const particlesCount = 100;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = [];
    
    for (let i = 0; i < particlesCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        particlesPositions.push(
            Math.cos(angle) * radius, // x
            Math.random() * 3,        // y
            Math.sin(angle) * radius  // z
        );
    }
    
    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlesPositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.15,
        transparent: true,
        opacity: 0.7
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Animar partículas
    const animateCenterParticles = () => {
        const time = Date.now() * 0.001;
        const positions = particlesGeometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Movimento circular
            const x = positions[i];
            const z = positions[i + 2];
            const angle = Math.atan2(z, x) + 0.005;
            const radius = Math.sqrt(x * x + z * z);
            
            positions[i] = Math.cos(angle) * radius;
            positions[i + 2] = Math.sin(angle) * radius;
            
            // Movimento vertical
            positions[i + 1] = Math.sin(time * 2 + i / 3) * 0.5 + 1.5;
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateCenterParticles);
    };
    
    animateCenterParticles();
    
    // Adicionar efeito de pulsação à plataforma
    const pulsePlatform = () => {
        const time = Date.now() * 0.001;
        centerPlatform.scale.y = 1 + Math.sin(time * 3) * 0.1;
        centerLight.intensity = 1 + Math.sin(time * 5) * 0.3;
        requestAnimationFrame(pulsePlatform);
    };
    
    pulsePlatform();

}

// Criar uma seção do portfólio
function createPortfolioSection(position, name, color, infoItems = [], curiosityItems = []) {
    // Plataforma
    const platformGeometry = new THREE.BoxGeometry(10, 0.5, 10);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: color });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.copy(position);
    platform.position.y = 0.25;
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);
    
    // Texto do título (usando sprite)
    const titleCanvas = document.createElement('canvas');
    const titleContext = titleCanvas.getContext('2d');
    titleCanvas.width = 256;
    titleCanvas.height = 128;
    titleContext.fillStyle = '#ffffff';
    titleContext.font = 'Bold 40px Arial';
    titleContext.textAlign = 'center';
    titleContext.fillText(name, 128, 64);
    
    const titleTexture = new THREE.CanvasTexture(titleCanvas);
    const titleMaterial = new THREE.SpriteMaterial({ map: titleTexture });
    const titleText = new THREE.Sprite(titleMaterial);
    titleText.position.copy(position);
    titleText.position.y = 2;
    titleText.scale.set(4, 2, 1);
    scene.add(titleText);
    
    // Criar holograma principal com as informações
    createHologram(position, name, color, infoItems);
    
    // Adicionar visualização web do projeto (apenas para seções que não são 'Sobre Mim')
    if (name !== 'Sobre Mim') {
        // Criar uma representação visual de como o projeto aparece na web
        const webViewGeometry = new THREE.PlaneGeometry(6, 4);
        const webViewCanvas = document.createElement('canvas');
        const webViewContext = webViewCanvas.getContext('2d');
        webViewCanvas.width = 600;
        webViewCanvas.height = 400;
        
        // Desenhar um mockup de site
        webViewContext.fillStyle = '#ffffff';
        webViewContext.fillRect(0, 0, 600, 400);
        
        // Barra de navegação
        webViewContext.fillStyle = '#333333';
        webViewContext.fillRect(0, 0, 600, 50);
        
        // Logo
        webViewContext.fillStyle = color.toString(16).padStart(6, '0');
        webViewContext.fillRect(20, 10, 30, 30);
        
        // Links de navegação
        webViewContext.fillStyle = '#ffffff';
        webViewContext.font = '16px Arial';
        webViewContext.fillText('Home', 100, 30);
        webViewContext.fillText('Sobre', 170, 30);
        webViewContext.fillText('Projetos', 240, 30);
        webViewContext.fillText('Contato', 320, 30);
        
        // Título do projeto
        webViewContext.fillStyle = '#333333';
        webViewContext.font = 'bold 24px Arial';
        webViewContext.fillText(name, 300, 100);
        
        // Conteúdo
        webViewContext.font = '16px Arial';
        webViewContext.fillText('Descrição do projeto ' + name, 300, 140);
        
        // Imagem do projeto
        webViewContext.fillStyle = color.toString(16).padStart(6, '0');
        webViewContext.fillRect(50, 150, 200, 150);
        
        // Texto descritivo
        webViewContext.fillStyle = '#333333';
        let yPos = 180;
        infoItems.forEach(item => {
            if (item.length > 40) {
                webViewContext.fillText(item.substring(0, 40) + '...', 300, yPos);
            } else {
                webViewContext.fillText(item, 300, yPos);
            }
            yPos += 30;
        });
        
        // Rodapé
        webViewContext.fillStyle = '#eeeeee';
        webViewContext.fillRect(0, 350, 600, 50);
        webViewContext.fillStyle = '#333333';
        webViewContext.fillText('© 2023 ' + name + ' - Todos os direitos reservados', 300, 380);
        
        const webViewTexture = new THREE.CanvasTexture(webViewCanvas);
        const webViewMaterial = new THREE.MeshBasicMaterial({ map: webViewTexture, side: THREE.DoubleSide });
        const webView = new THREE.Mesh(webViewGeometry, webViewMaterial);
        
        // Posicionar a visualização web acima da plataforma
        webView.position.copy(position);
        webView.position.y = 4;
        webView.rotation.x = -Math.PI / 6; // Inclinar um pouco para melhor visualização
        scene.add(webView);
    }
    
    // Adicionar objetos decorativos
    for (let i = 0; i < 5; i++) {
        const size = Math.random() * 0.5 + 0.5;
        const decorGeometry = new THREE.BoxGeometry(size, size, size);
        const decorMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const decor = new THREE.Mesh(decorGeometry, decorMaterial);
        decor.position.copy(position);
        decor.position.x += (Math.random() - 0.5) * 3;
        decor.position.z += (Math.random() - 0.5) * 3;
        decor.position.y = size / 2 + 0.5;
        decor.castShadow = true;
        decor.receiveShadow = true;
        scene.add(decor);
    }
    
    // Adicionar à lista de seções do portfólio
    portfolioSections.push({
        position: position,
        name: name,
        platform: platform
    });
}

// Criar holograma informativo
function createHologram(position, name, color, infoItems, isCuriosity = false) {
    // Grupo para o holograma
    const hologramGroup = new THREE.Group();
    hologramGroup.position.copy(position);
    hologramGroup.position.y = 1.5;
    
    // Criar canvas para informações
    const infoCanvas = document.createElement('canvas');
    const infoContext = infoCanvas.getContext('2d');
    infoCanvas.width = 512;
    infoCanvas.height = 256;
    
    // Configurar estilo do texto
    infoContext.fillStyle = '#ffffff';
    infoContext.font = '20px Arial';
    infoContext.textAlign = 'center';
    
    // Adicionar título
    infoContext.font = 'Bold 30px Arial';
    infoContext.fillText(name, 256, 30);
    
    // Adicionar cada item de informação
    infoContext.font = '20px Arial';
    infoItems.forEach((item, index) => {
        infoContext.fillText(item, 256, 70 + (index * 30));
    });
    
    // Criar sprite com as informações
    const infoTexture = new THREE.CanvasTexture(infoCanvas);
    const infoMaterial = new THREE.SpriteMaterial({ 
        map: infoTexture,
        transparent: true,
        opacity: 0.9,
        color: new THREE.Color(color).multiplyScalar(1.5) // Tornar mais brilhante
    });
    const infoSprite = new THREE.Sprite(infoMaterial);
    infoSprite.scale.set(5, 2.5, 1);
    hologramGroup.add(infoSprite);
    
    // Adicionar efeito de brilho
    const glowGeometry = new THREE.CircleGeometry(3, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -1;
    hologramGroup.add(glow);
    
    // Se for um holograma de curiosidades, adicionar efeitos especiais
    if (isCuriosity) {
        // Adicionar partículas flutuantes
        const particlesCount = 20;
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesPositions = [];
        
        for (let i = 0; i < particlesCount; i++) {
            particlesPositions.push(
                (Math.random() - 0.5) * 4, // x
                Math.random() * 2,          // y
                (Math.random() - 0.5) * 4   // z
            );
        }
        
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlesPositions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(color).multiplyScalar(1.8),
            size: 0.1,
            transparent: true,
            opacity: 0.7
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        hologramGroup.add(particles);
        
        // Adicionar animação às partículas
        const animateParticles = () => {
            const positions = particlesGeometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += 0.01; // Mover para cima
                
                // Resetar quando chegar ao topo
                if (positions[i + 1] > 2) {
                    positions[i + 1] = 0;
                }
            }
            
            particlesGeometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }
    
    // Adicionar à cena (inicialmente invisível)
    hologramGroup.visible = false;
    scene.add(hologramGroup);
    
    // Adicionar ao array de hologramas
    holograms.push({
        group: hologramGroup,
        position: position.clone(),
        name: name,
        isCuriosity: isCuriosity
    });
}

// Função para criar pontos de interação dos projetos
function createProjectSpot(position, name, color, infoItems = [], detailItems = []) {
    // Plataforma do projeto
    const spotGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 32);
    const spotMaterial = new THREE.MeshStandardMaterial({ color: color });
    const spot = new THREE.Mesh(spotGeometry, spotMaterial);
    spot.position.copy(position);
    spot.position.y = 0.2;
    spot.receiveShadow = true;
    spot.castShadow = true;
    scene.add(spot);

    // Texto do nome do projeto
    const nameCanvas = document.createElement('canvas');
    const nameContext = nameCanvas.getContext('2d');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    nameContext.fillStyle = '#ffffff';
    nameContext.font = 'Bold 28px Arial';
    nameContext.textAlign = 'center';
    nameContext.fillText(name, 128, 40);
    const nameTexture = new THREE.CanvasTexture(nameCanvas);
    const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
    const nameSprite = new THREE.Sprite(nameMaterial);
    nameSprite.position.copy(position);
    nameSprite.position.y = 1.5;
    nameSprite.scale.set(3, 0.8, 1);
    scene.add(nameSprite);

    // Criar holograma informativo do projeto
    createHologram(position, name, color, infoItems);
    
    // Criar holograma de detalhes se houver itens
    if (detailItems.length > 0) {
        const detailPosition = position.clone();
        detailPosition.y += 1;
        createHologram(detailPosition, "Detalhes", color, detailItems, true);
    }
    
    // Adicionar efeito de pulsação à plataforma
    const pulseAnimation = () => {
        const time = Date.now() * 0.001;
        spot.scale.y = 1 + Math.sin(time * 2) * 0.1;
        requestAnimationFrame(pulseAnimation);
    };
    pulseAnimation();
}

// Carregar o modelo do carro
function loadCarModel() {
    // Como não temos um modelo GLTF específico, vamos criar um carro simples com geometrias
    createSimpleCar();
    // Definir o carro como entidade ativa inicialmente
    activeEntity = car;
}

// Carregar o modelo do personagem
function loadCharacterModel() {
    // Criar um personagem simples com geometrias
    createSimpleCharacter();
}

// Criar um veículo lunar simples com geometrias
function createSimpleCar() {
    // Grupo para o veículo lunar
    car = new THREE.Group();
    
    // Base do veículo lunar
    const carBodyGeometry = new THREE.BoxGeometry(2, 0.4, 3);
    const carBodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0.8 
    });
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
    carBody.position.y = 0.5;
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    car.add(carBody);
    
    // Módulo de comando (cabine)
    const carCabinGeometry = new THREE.CylinderGeometry(0.8, 1, 0.8, 8);
    const carCabinMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd,
        roughness: 0.4,
        metalness: 0.9 
    });
    const carCabin = new THREE.Mesh(carCabinGeometry, carCabinMaterial);
    carCabin.position.y = 1.1;
    carCabin.position.z = 0.2;
    carCabin.castShadow = true;
    carCabin.receiveShadow = true;
    car.add(carCabin);
    
    // Visor da cabine
    const carWindowGeometry = new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const carWindowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x88ccff, 
        transparent: true, 
        opacity: 0.7,
        metalness: 0.9,
        roughness: 0.1
    });
    
    // Visor frontal
    const frontWindow = new THREE.Mesh(carWindowGeometry, carWindowMaterial);
    frontWindow.position.set(0, 1.1, 0.2);
    frontWindow.rotation.x = Math.PI / 2;
    car.add(frontWindow);
    
    // Adicionar indicador visual de interação
    const interactionGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const interactionMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
    });
    const interactionIndicator = new THREE.Mesh(interactionGeometry, interactionMaterial);
    interactionIndicator.position.set(0, 1.5, 0);
    interactionIndicator.visible = false;
    interactionIndicator.name = 'interactionIndicator';
    car.add(interactionIndicator);
    
    // Antenas
    const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        roughness: 0.5,
        metalness: 0.8
    });
    
    // Antena 1
    const antenna1 = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna1.position.set(-0.5, 1.6, 0.2);
    car.add(antenna1);
    
    // Antena 2
    const antenna2 = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna2.position.set(0.5, 1.6, 0.2);
    car.add(antenna2);
    
    // Rodas/esteiras do veículo lunar
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Roda frontal esquerda
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-1.1, 0.4, 1);
    wheelFL.castShadow = true;
    car.add(wheelFL);
    
    // Roda frontal direita
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(1.1, 0.4, 1);
    wheelFR.castShadow = true;
    car.add(wheelFR);
    
    // Roda traseira esquerda
    const wheelBL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBL.rotation.z = Math.PI / 2;
    wheelBL.position.set(-1.1, 0.4, -1);
    wheelBL.castShadow = true;
    car.add(wheelBL);
    
    // Roda traseira direita
    const wheelBR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBR.rotation.z = Math.PI / 2;
    wheelBR.position.set(1.1, 0.4, -1);
    wheelBR.castShadow = true;
    car.add(wheelBR);
    
    // Luzes do veículo
    const headlightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffcc, 
        emissive: 0xffffcc,
        emissiveIntensity: 1.5
    });
    
    // Luz esquerda
    const headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlightL.position.set(-0.6, 0.5, 1.5);
    car.add(headlightL);
    
    // Luz direita
    const headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlightR.position.set(0.6, 0.5, 1.5);
    car.add(headlightR);
    
    // Painéis solares
    const panelGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.8);
    const panelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2244aa, 
        roughness: 0.5,
        metalness: 0.8
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, 1.5, -1);
    car.add(panel);
    
    // Posicionar o carro
    car.position.set(0, 0, 0);
    scene.add(car);
    
    // Adicionar câmera ao carro
    const carCamera = new THREE.Object3D();
    carCamera.position.set(0, 3, -6);
    carCamera.rotation.y = Math.PI;
    car.add(carCamera);
    
    // Salvar a referência do modelo do carro
    carModel = car;
}

// Configurar controles
function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.enabled = true; // Habilitar controles orbitais para permitir a rotação da câmera
}

// Função de animação
// Função para atualizar a visibilidade dos hologramas com base na proximidade do jogador
function updateHologramsVisibility() {
    // Distância máxima para mostrar os hologramas
    const MAX_HOLOGRAM_DISTANCE = 10;
    const MAX_CURIOSITY_DISTANCE = 5;
    
    // Obter a posição atual do jogador (carro ou personagem)
    const playerPosition = activeEntity.position;
    
    // Verificar cada holograma
    holograms.forEach(hologram => {
        // Calcular a distância entre o jogador e o holograma
        const distance = playerPosition.distanceTo(hologram.position);
        
        // Distância máxima depende do tipo de holograma
        const maxDistance = hologram.isCuriosity ? MAX_CURIOSITY_DISTANCE : MAX_HOLOGRAM_DISTANCE;
        
        // Atualizar a visibilidade com base na distância
        // Evitar duplicação: só mostrar se não estiver visível e estiver próximo
        // ou se estiver visível e ainda estiver próximo
        if (!hologram.group.visible && distance < maxDistance) {
            hologram.group.visible = true;
            // Efeito de aparecimento suave
            hologram.group.scale.set(0.1, 0.1, 0.1);
        } else if (hologram.group.visible && distance >= maxDistance) {
            // Efeito de desaparecimento
            hologram.group.visible = false;
        }
        
        // Adicionar efeito de opacidade e escala baseado na distância
        if (hologram.group.visible) {
            // Quanto mais perto, mais opaco
            const opacity = 1 - (distance / maxDistance) * 0.5;
            // Ajustar escala suavemente
            const targetScale = 1 - (distance / maxDistance) * 0.3;
            hologram.group.scale.x += (targetScale - hologram.group.scale.x) * 0.1;
            hologram.group.scale.y += (targetScale - hologram.group.scale.y) * 0.1;
            hologram.group.scale.z += (targetScale - hologram.group.scale.z) * 0.1;
            
            hologram.group.children.forEach(child => {
                if (child.material && child.material.opacity !== undefined) {
                    child.material.opacity = Math.max(0.5, opacity);
                }
            });
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    
    // Atualizar controles do carro/personagem
    updateActiveEntity(delta);
    
    // Atualizar visibilidade dos hologramas
    updateHologramsVisibility();
    
    // Atualizar hologramas (efeitos de flutuação e rotação)
    updateHolograms();
    
    // Verificar proximidade com seções do portfólio
    checkPortfolioProximity();
    
    controls.update();
    renderer.render(scene, camera);
}

// Verificar proximidade com seções do portfólio
function checkPortfolioProximity() {
    if (!activeEntity) return;
    
    const ACTIVATION_DISTANCE = 10; // Distância para ativar o holograma
    
    // Verificar cada seção do portfólio
    portfolioSections.forEach((section, index) => {
        const distance = activeEntity.position.distanceTo(section.position);
        
        // Efeito de brilho na plataforma quando o jogador está próximo
        if (distance <= ACTIVATION_DISTANCE) {
            // Adicionar efeito de brilho à plataforma
            if (!section.glowEffect) {
                const glowGeometry = new THREE.RingGeometry(5, 5.5, 32);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                section.glowEffect = new THREE.Mesh(glowGeometry, glowMaterial);
                section.glowEffect.position.copy(section.position);
                section.glowEffect.position.y = 0.02;
                section.glowEffect.rotation.x = -Math.PI / 2;
                scene.add(section.glowEffect);
            }
        } else if (section.glowEffect) {
            // Remover efeito de brilho quando o jogador se afasta
            scene.remove(section.glowEffect);
            section.glowEffect = null;
        }
    });
}

// Atualizar hologramas (efeitos de flutuação e rotação)
function updateHolograms() {
    const time = clock.getElapsedTime();
    
    holograms.forEach(hologram => {
        if (hologram.group.visible) {
            // Efeito de flutuação
            hologram.group.position.y = hologram.position.y + 1.5 + Math.sin(time * 2) * 0.1;
            
            // Efeito de rotação suave
            if (hologram.isCuriosity) {
                hologram.group.rotation.y = time * 0.8; // Rotação mais rápida para curiosidades
            } else {
                hologram.group.rotation.y = time * 0.3; // Rotação mais lenta para informações normais
            }
        }
    });
}

// Atualizar controles do carro
function updateCarControls() {
    if (!carModel) return;
    
    // Aplicar desaceleração
    if (carSettings.speed > 0) {
        carSettings.speed -= carSettings.deceleration;
        if (carSettings.speed < 0) carSettings.speed = 0;
    } else if (carSettings.speed < 0) {
        carSettings.speed += carSettings.deceleration;
        if (carSettings.speed > 0) carSettings.speed = 0;
    }
    
    // Verificar teclas pressionadas
    if (keysPressed['w'] || keysPressed['arrowup']) {
        // Acelerar para frente
        carSettings.speed += carSettings.acceleration;
        if (carSettings.speed > carSettings.maxSpeed) {
            carSettings.speed = carSettings.maxSpeed;
        }
    }
    
    if (keysPressed['s'] || keysPressed['arrowdown']) {
        // Acelerar para trás
        carSettings.speed -= carSettings.acceleration;
        if (carSettings.speed < -carSettings.maxSpeed / 2) {
            carSettings.speed = -carSettings.maxSpeed / 2;
        }
    }
    
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        // Virar à esquerda
        carModel.rotation.y += carSettings.turnSpeed * (carSettings.speed / carSettings.maxSpeed);
    }
    
    if (keysPressed['d'] || keysPressed['arrowright']) {
        // Virar à direita
        carModel.rotation.y -= carSettings.turnSpeed * (carSettings.speed / carSettings.maxSpeed);
    }
    
    // Atualizar direção do carro
    carSettings.direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), carModel.rotation.y);
    
    // Atualizar velocidade
    carSettings.velocity.copy(carSettings.direction).multiplyScalar(carSettings.speed);
    
    // Atualizar posição
    carModel.position.add(carSettings.velocity);
    
    // Limitar área de movimento
    const limit = 45;
    if (carModel.position.x > limit) carModel.position.x = limit;
    if (carModel.position.x < -limit) carModel.position.x = -limit;
    if (carModel.position.z > limit) carModel.position.z = limit;
    if (carModel.position.z < -limit) carModel.position.z = -limit;
}

// Atualizar posição da câmera
function updateCamera() {
    if (!activeEntity) return;
    
    // Verificar se os controles orbitais estão sendo usados
    if (controls.enabled) {
        // Definir o alvo dos controles orbitais para a entidade ativa
        controls.target.copy(activeEntity.position);
    } else {
        // Modo de câmera seguindo a entidade (quando os controles orbitais estão desativados)
        // Posição da câmera atrás da entidade ativa
        const cameraOffset = new THREE.Vector3(0, 5, -10);
        cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), activeEntity.rotation.y);
        
        // Posição alvo da câmera
        const targetPosition = activeEntity.position.clone().add(cameraOffset);
        
        // Suavizar movimento da câmera
        camera.position.lerp(targetPosition, 0.05);
        
        // Fazer a câmera olhar para a entidade ativa
        camera.lookAt(activeEntity.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }
}

// Redimensionar janela
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Tecla pressionada
function onKeyDown(event) {
    const key = event.key.toLowerCase();
    keysPressed[key] = true;
    
    // Registrar teclas de seta com nomes padronizados
    if (event.key === 'ArrowUp') keysPressed['arrowup'] = true;
    if (event.key === 'ArrowDown') keysPressed['arrowdown'] = true;
    if (event.key === 'ArrowLeft') keysPressed['arrowleft'] = true;
    if (event.key === 'ArrowRight') keysPressed['arrowright'] = true;
    
    // Tecla E para entrar/sair do carro
    if (key === 'e') {
        toggleVehicleEntry();
    }
    
    // Tecla de espaço para pular (apenas quando estiver controlando o personagem)
    if (key === ' ' && activeEntity === character && !characterSettings.isJumping) {
        characterSettings.isJumping = true;
        characterSettings.jumpVelocity = 0.1;
    }
    
    // Tecla C para alternar entre controles orbitais e câmera seguindo a entidade
    if (key === 'c') {
        controls.enabled = !controls.enabled;
    }
}

// Tecla solta
function onKeyUp(event) {
    const key = event.key.toLowerCase();
    keysPressed[key] = false;
    
    // Liberar teclas de seta com nomes padronizados
    if (event.key === 'ArrowUp') keysPressed['arrowup'] = false;
    if (event.key === 'ArrowDown') keysPressed['arrowdown'] = false;
    if (event.key === 'ArrowLeft') keysPressed['arrowleft'] = false;
    if (event.key === 'ArrowRight') keysPressed['arrowright'] = false;
}

// Criar um personagem simples com geometrias
function createSimpleCharacter() {
    // Grupo para o astronauta
    character = new THREE.Group();
    
    // Corpo/traje espacial
    const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.3, 1.2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.6
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    character.add(body);
    
    // Capacete
    const helmetGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const helmetMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.8
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 1.7;
    helmet.castShadow = true;
    character.add(helmet);
    
    // Visor do capacete
    const visorGeometry = new THREE.SphereGeometry(0.2, 16, 16, Math.PI * 0.25, Math.PI * 1.5, Math.PI * 0.25, Math.PI * 0.5);
    const visorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x88ccff, 
        transparent: true, 
        opacity: 0.7,
        metalness: 0.9,
        roughness: 0.1
    });
    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, 1.7, 0.15);
    character.add(visor);
    
    // Mochila de oxigênio
    const backpackGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.2);
    const backpackMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd,
        roughness: 0.5,
        metalness: 0.7
    });
    const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial);
    backpack.position.set(0, 1.1, -0.25);
    backpack.castShadow = true;
    character.add(backpack);
    
    // Braços/mangas do traje
    const armGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.7, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.6
    });
    
    // Braço esquerdo
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.45, 1.1, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    character.add(leftArm);
    
    // Braço direito
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.45, 1.1, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    character.add(rightArm);
    
    // Luvas
    const gloveGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const gloveMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd,
        roughness: 0.4,
        metalness: 0.7
    });
    
    // Luva esquerda
    const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
    leftGlove.position.set(-0.6, 0.7, 0);
    leftGlove.castShadow = true;
    character.add(leftGlove);
    
    // Luva direita
    const rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
    rightGlove.position.set(0.6, 0.7, 0);
    rightGlove.castShadow = true;
    character.add(rightGlove);
    
    // Pernas/calças do traje
    const legGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.6
    });
    
    // Perna esquerda
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    character.add(leftLeg);
    
    // Perna direita
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    character.add(rightLeg);
    
    // Botas
     const bootGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25);
     const bootMaterial = new THREE.MeshStandardMaterial({ 
         color: 0xdddddd,
         roughness: 0.4,
         metalness: 0.7
     });
     
     // Bota esquerda
     const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
     leftBoot.position.set(-0.2, 0, 0.1);
     leftBoot.castShadow = true;
     character.add(leftBoot);
     
     // Bota direita
     const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
     rightBoot.position.set(0.2, 0, 0.1);
     rightBoot.castShadow = true;
     character.add(rightBoot);
    
    // Posicionar o personagem
    character.position.set(3, 0, 0); // Posição inicial ao lado do carro
    character.visible = false; // Inicialmente invisível, pois começa no carro
    scene.add(character);
    
    // Salvar a referência do modelo do personagem
    characterModel = character;
}

// Alternar entre entrar e sair do carro
function toggleVehicleEntry() {
    if (!isCharacterInCar) {
        // Verificar distância entre personagem e carro
        const distance = character.position.distanceTo(car.position);
        
        if (distance <= INTERACTION_DISTANCE) {
            // Entrar no carro
            isCharacterInCar = true;
            character.visible = false;
            activeEntity = car;
            
            // Atualizar texto informativo
            updateInfoText(true);
        }
    } else {
        // Sair do carro
        isCharacterInCar = false;
        
        // Posicionar o personagem próximo ao carro
        const exitOffset = new THREE.Vector3(2, 0, 0);
        exitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
        character.position.copy(car.position).add(exitOffset);
        character.rotation.y = car.rotation.y;
        
        // Garantir que o personagem esteja visível e no chão
        character.position.y = 0;
        character.visible = true;
        activeEntity = character;
        
        // Atualizar texto informativo
        updateInfoText(false);
        
        console.log('Saiu do carro. Posição do personagem:', character.position);
    }
}

// Verificar interação com o carro
function checkCarInteraction() {
    if (!character || !car || isCharacterInCar) return;
    
    // Calcular distância entre personagem e carro
    const distance = character.position.distanceTo(car.position);
    
    // Obter o indicador de interação
    const interactionIndicator = car.getObjectByName('interactionIndicator');
    
    // Mostrar indicador de interação quando estiver próximo o suficiente
    if (distance <= INTERACTION_DISTANCE) {
        if (interactionIndicator) {
            interactionIndicator.visible = true;
        }
    } else {
        if (interactionIndicator) {
            interactionIndicator.visible = false;
        }
    }
}

// Atualizar controles do personagem
function updateCharacterControls() {
    if (!characterModel) return;
    
    // Aplicar desaceleração
    if (characterSettings.speed > 0) {
        characterSettings.speed -= characterSettings.deceleration;
        if (characterSettings.speed < 0) characterSettings.speed = 0;
    } else if (characterSettings.speed < 0) {
        characterSettings.speed += characterSettings.deceleration;
        if (characterSettings.speed > 0) characterSettings.speed = 0;
    }
    
    // Verificar teclas pressionadas
    if (keysPressed['w'] || keysPressed['arrowup']) {
        // Mover para frente
        characterSettings.speed += characterSettings.acceleration;
        if (characterSettings.speed > characterSettings.maxSpeed) {
            characterSettings.speed = characterSettings.maxSpeed;
        }
    }
    
    if (keysPressed['s'] || keysPressed['arrowdown']) {
        // Mover para trás
        characterSettings.speed -= characterSettings.acceleration;
        if (characterSettings.speed < -characterSettings.maxSpeed / 2) {
            characterSettings.speed = -characterSettings.maxSpeed / 2;
        }
    }
    
    if (keysPressed['a'] || keysPressed['arrowleft']) {
        // Virar à esquerda
        characterModel.rotation.y += characterSettings.turnSpeed;
    }
    
    if (keysPressed['d'] || keysPressed['arrowright']) {
        // Virar à direita
        characterModel.rotation.y -= characterSettings.turnSpeed;
    }
    
    // Atualizar pulo
    if (characterSettings.isJumping) {
        // Aplicar física de pulo
        characterModel.position.y += characterSettings.jumpVelocity;
        characterSettings.jumpVelocity -= 0.006; // Gravidade
        
        // Verificar se o personagem voltou ao chão
        if (characterModel.position.y <= 0) {
            characterModel.position.y = 0;
            characterSettings.isJumping = false;
            characterSettings.jumpVelocity = 0;
        }
    }
    
    // Atualizar direção do personagem
    characterSettings.direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), characterModel.rotation.y);
    
    // Atualizar velocidade
    characterSettings.velocity.copy(characterSettings.direction).multiplyScalar(characterSettings.speed);
    
    // Atualizar posição
    characterModel.position.add(characterSettings.velocity);
    
    // Limitar área de movimento
    const limit = 45;
    if (characterModel.position.x > limit) characterModel.position.x = limit;
    if (characterModel.position.x < -limit) characterModel.position.x = -limit;
    if (characterModel.position.z > limit) characterModel.position.z = limit;
    if (characterModel.position.z < -limit) characterModel.position.z = -limit;
}

// Atualizar texto informativo
function updateInfoText(isInCar) {
    const infoElement = document.querySelector('.info');
    
    if (isInCar) {
        infoElement.innerHTML = `
            <p>Use as teclas <strong>W, A, S, D</strong> ou <strong>↑, ←, ↓, →</strong> para dirigir o carro</p>
            <p>Pressione <strong>E</strong> para sair do carro</p>
            <p>Explore o portfólio navegando pelo ambiente 3D</p>
        `;
    } else {
        infoElement.innerHTML = `
            <p>Use as teclas <strong>W, A, S, D</strong> ou <strong>↑, ←, ↓, →</strong> para mover o personagem</p>
            <p>Pressione <strong>Espaço</strong> para pular</p>
            <p>Pressione <strong>E</strong> perto do carro para entrar nele</p>
            <p>Explore o portfólio navegando pelo ambiente 3D</p>
        `;
    }
}

// Função para atualizar a entidade ativa (carro ou personagem)
function updateActiveEntity(delta) {
    if (!activeEntity) return;
    
    // Se a entidade ativa for o carro
    if (activeEntity === car) {
        // Atualizar lógica do carro
        // Movimentação para frente/trás
        if (keysPressed['w'] || keysPressed['arrowup']) {
            carSettings.speed += carSettings.acceleration;
        } else if (keysPressed['s'] || keysPressed['arrowdown']) {
            carSettings.speed -= carSettings.acceleration;
        } else {
            // Desaceleração quando nenhuma tecla está pressionada
            if (carSettings.speed > 0) {
                carSettings.speed -= carSettings.deceleration;
            } else if (carSettings.speed < 0) {
                carSettings.speed += carSettings.deceleration;
            }
            
            // Evitar valores muito pequenos
            if (Math.abs(carSettings.speed) < 0.001) {
                carSettings.speed = 0;
            }
        }
        
        // Limitar velocidade máxima (positiva e negativa)
        carSettings.speed = Math.max(-carSettings.maxSpeed, Math.min(carSettings.speed, carSettings.maxSpeed));
        
        // Rotação
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            car.rotation.y += carSettings.turnSpeed;
        }
        if (keysPressed['d'] || keysPressed['arrowright']) {
            car.rotation.y -= carSettings.turnSpeed;
        }
        
        // Atualizar direção e posição
        carSettings.direction.set(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
        car.position.add(carSettings.direction.clone().multiplyScalar(carSettings.speed));
    }
    
    // Se a entidade ativa for o personagem
    if (activeEntity === character) {
        // Atualizar lógica do personagem
        // Movimentação para frente/trás
        if (keysPressed['w'] || keysPressed['arrowup']) {
            characterSettings.speed += characterSettings.acceleration;
        } else if (keysPressed['s'] || keysPressed['arrowdown']) {
            characterSettings.speed -= characterSettings.acceleration;
        } else {
            // Desaceleração quando nenhuma tecla está pressionada
            if (characterSettings.speed > 0) {
                characterSettings.speed -= characterSettings.deceleration;
            } else if (characterSettings.speed < 0) {
                characterSettings.speed += characterSettings.deceleration;
            }
            
            // Evitar valores muito pequenos
            if (Math.abs(characterSettings.speed) < 0.001) {
                characterSettings.speed = 0;
            }
        }
        
        // Limitar velocidade máxima (positiva e negativa)
        characterSettings.speed = Math.max(-characterSettings.maxSpeed, Math.min(characterSettings.speed, characterSettings.maxSpeed));
        
        // Rotação
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            character.rotation.y += characterSettings.turnSpeed;
        }
        if (keysPressed['d'] || keysPressed['arrowright']) {
            character.rotation.y -= characterSettings.turnSpeed;
        }
        
        // Atualizar direção e posição
        characterSettings.direction.set(Math.sin(character.rotation.y), 0, Math.cos(character.rotation.y));
        character.position.add(characterSettings.direction.clone().multiplyScalar(characterSettings.speed));
        
        // Atualizar salto do personagem
        if (characterSettings.isJumping) {
            character.position.y += characterSettings.jumpVelocity;
            characterSettings.jumpVelocity -= 0.01; // Gravidade
            
            // Verificar se o personagem voltou ao chão
            if (character.position.y <= 0) {
                character.position.y = 0;
                characterSettings.isJumping = false;
                characterSettings.jumpVelocity = 0;
            }
        }
    }
    
    // Atualizar a câmera para seguir a entidade ativa
    updateCamera();
}
