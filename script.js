// Variáveis globais
let audioContext;
let analyser;
let dataArray;
let source;
let isAudioPlaying = false;
let beatDetection = false;

// Elementos DOM
const landing = document.getElementById('landing');
const mainContent = document.getElementById('main-content');
const audioToggle = document.getElementById('audio-toggle');
const backgroundAudio = document.getElementById('background-audio');
const beatBars = document.querySelectorAll('.beat-bar');
const particles = document.querySelectorAll('.particle');
const profileImg = document.getElementById('profile-img');

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    createCustomCursor();
    animateParticles();
});

// Inicializar aplicação
function initializeApp() {
    // Configurar áudio context
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        setupAudioAnalyser();
    } catch (error) {
        console.log('Web Audio API não suportada:', error);
    }

    // Configurar vídeo de fundo
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        bgVideo.addEventListener('error', function() {
            // Fallback para quando o vídeo não carrega
            document.querySelector('.video-background').style.background = 
                'linear-gradient(45deg, #000428, #004e92, #000428)';
        });
    }

    // Animação de entrada da página
    setTimeout(() => {
        document.body.style.cursor = 'none';
    }, 1000);
}

// Configurar event listeners
function setupEventListeners() {
    // Click to enter
    landing.addEventListener('click', enterSite);
    
    // Controles de áudio
    audioToggle.addEventListener('click', toggleAudio);
    
    // Hover effects nos links sociais
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', handleSocialHover);
        link.addEventListener('mouseleave', handleSocialLeave);
    });

    // Efeitos de hover na foto de perfil
    profileImg.addEventListener('mouseenter', handleProfileHover);
    profileImg.addEventListener('mouseleave', handleProfileLeave);

    // Detecção de movimento do mouse
    document.addEventListener('mousemove', updateCustomCursor);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);

    // Resize handler
    window.addEventListener('resize', handleResize);
}

// Entrar no site principal
function enterSite() {
    landing.classList.add('fade-out');
    
    setTimeout(() => {
        landing.style.display = 'none';
        mainContent.classList.remove('hidden');
        
        setTimeout(() => {
            mainContent.classList.add('visible');
            startAnimations();
        }, 100);
    }, 1000);
}

// Configurar analisador de áudio
function setupAudioAnalyser() {
    if (!audioContext) return;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // Conectar áudio ao analisador quando o áudio começar
    backgroundAudio.addEventListener('play', () => {
        if (!source) {
            source = audioContext.createMediaElementSource(backgroundAudio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        }
        beatDetection = true;
        animateBeatVisualizer();
    });
}

// Toggle do áudio
async function toggleAudio() {
    if (isAudioPlaying) {
        backgroundAudio.pause();
        audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        audioToggle.classList.add('muted');
        isAudioPlaying = false;
        beatDetection = false;
    } else {
        try {
            // Resumir contexto de áudio se necessário
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            // Definir volume do áudio
            backgroundAudio.volume = 0.5;
            
            // Forçar carregamento do áudio
            backgroundAudio.load();
            
            // Tentar reproduzir áudio
            await backgroundAudio.play();
            
            console.log('Áudio reproduzindo com sucesso!');
            audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            audioToggle.classList.remove('muted');
            isAudioPlaying = true;
            
            // Verificar se o áudio está realmente tocando
            setTimeout(() => {
                if (backgroundAudio.paused || backgroundAudio.currentTime === 0) {
                    console.log('Áudio não está tocando, usando fallback sintético');
                    startSyntheticAudio();
                }
            }, 1000);
            
        } catch (error) {
            console.log('Erro ao reproduzir áudio:', error);
            console.log('Usando áudio sintético como fallback');
            startSyntheticAudio();
            audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
            audioToggle.classList.remove('muted');
            isAudioPlaying = true;
        }
    }
}

// Áudio sintético para quando não há arquivo de música
function startSyntheticAudio() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Criar um padrão de batidas sintético
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    
    // Simular batidas para o visualizador
    beatDetection = true;
    animateSyntheticBeat();
}

// Animação de batidas sintéticas
function animateSyntheticBeat() {
    if (!beatDetection) return;
    
    // Simular dados de frequência
    const syntheticData = new Uint8Array(256);
    for (let i = 0; i < syntheticData.length; i++) {
        syntheticData[i] = Math.random() * 255 * (Math.sin(Date.now() * 0.01 + i) * 0.5 + 0.5);
    }
    
    // Usar os dados sintéticos para animar
    animateBeatVisualizerWithData(syntheticData);
    
    setTimeout(() => animateSyntheticBeat(), 50);
}

// Animação do visualizador de batidas
function animateBeatVisualizer() {
    if (!beatDetection || !analyser) return;

    analyser.getByteFrequencyData(dataArray);
    animateBeatVisualizerWithData(dataArray);
    requestAnimationFrame(animateBeatVisualizer);
}

// Função unificada para animar com dados reais ou sintéticos
function animateBeatVisualizerWithData(frequencyData) {
    // Calcular intensidade média
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
    }
    const average = sum / frequencyData.length;

    // Extrair cores dominantes do vídeo de fundo
    const dominantColors = extractDominantColors();
    
    // Animar barras baseado na intensidade
    beatBars.forEach((bar, index) => {
        const intensity = frequencyData[index * 10] || average;
        const height = Math.max(20, (intensity / 255) * 80);
        bar.style.height = height + 'px';
        
        // Usar cores adaptativas baseadas no fundo
        const color1 = dominantColors.primary;
        const color2 = dominantColors.secondary;
        
        if (intensity > 150) {
            bar.style.background = `linear-gradient(to top, ${color2}, ${color1})`;
        } else {
            bar.style.background = `linear-gradient(to top, ${color1}, ${color2})`;
        }
    });

    // Efeito de pulsação na foto de perfil
    if (average > 100) {
        profileImg.style.transform = `scale(${1 + (average / 2550)})`;
        // Adicionar brilho adaptativo
        profileImg.style.filter = `brightness(${1 + (average / 1000)}) saturate(${1 + (average / 500)})`;
    }

    // Animar partículas baseado no beat
    if (average > 120) {
        particles.forEach(particle => {
            particle.style.boxShadow = `0 0 ${average / 10}px ${dominantColors.accent}`;
            particle.style.background = dominantColors.accent;
        });
    }

    // Adaptar cores do texto baseado na intensidade
    adaptTextColors(average, dominantColors);
}

// Hover effects nos links sociais
function handleSocialHover(e) {
    const link = e.target.closest('.social-link');
    link.style.transform = 'translateY(-8px) scale(1.15) rotate(5deg)';
    
    // Efeito de partículas ao redor do link
    createHoverParticles(link);
}

function handleSocialLeave(e) {
    const link = e.target.closest('.social-link');
    link.style.transform = 'translateY(0) scale(1) rotate(0deg)';
}

// Efeitos na foto de perfil
function handleProfileHover() {
    profileImg.style.filter = 'brightness(1.2) contrast(1.1)';
    document.querySelector('.profile-ring').style.animationDuration = '1s';
}

function handleProfileLeave() {
    profileImg.style.filter = 'brightness(1) contrast(1)';
    document.querySelector('.profile-ring').style.animationDuration = '4s';
}


// Cursor customizado
function createCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #00ffff 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: difference;
        transition: transform 0.1s ease;
    `;
    document.body.appendChild(cursor);
}

function updateCustomCursor(e) {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor) {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    }
}

// Animações iniciais
function startAnimations() {
    // Animar entrada dos elementos
    const elements = [
        '.profile-picture',
        '.username-container',
        '.social-links',
        '.bio-text'
    ];

    elements.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.8s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        }
    });

    // Iniciar animação das partículas flutuantes
    animateFloatingParticles();
}

// Animar partículas flutuantes
function animateFloatingParticles() {
    particles.forEach((particle, index) => {
        const delay = index * 1000;
        const duration = 4000 + Math.random() * 4000;
        
        setTimeout(() => {
            particle.style.animation = `float ${duration}ms ease-in-out infinite`;
        }, delay);
    });
}

// Animar partículas existentes
function animateParticles() {
    setInterval(() => {
        particles.forEach(particle => {
            if (Math.random() > 0.7) {
                particle.style.boxShadow = `0 0 ${Math.random() * 20}px #00ffff`;
                setTimeout(() => {
                    particle.style.boxShadow = 'none';
                }, 200);
            }
        });
    }, 2000);
}

// Atalhos do teclado
function handleKeyboard(e) {
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'enter':
            if (landing.style.display !== 'none') {
                enterSite();
            } else {
                toggleAudio();
            }
            e.preventDefault();
            break;
        case 'm':
            toggleAudio();
            break;
        case 'f':
            toggleFullscreen();
            break;
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Erro ao entrar em fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Handle resize
function handleResize() {
    // Reajustar elementos se necessário
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
        // Reposicionar partículas aleatoriamente
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
    });
}

// Efeitos especiais aleatórios
setInterval(() => {
    // Glitch effect aleatório no username
    const username = document.querySelector('.username');
    if (username && Math.random() > 0.95) {
        username.style.animation = 'glitch 0.3s ease-in-out';
        setTimeout(() => {
            username.style.animation = '';
        }, 300);
    }

    // Pulse effect aleatório nos links sociais
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        if (Math.random() > 0.98) {
            link.style.animation = 'pulse 0.6s ease-in-out';
            setTimeout(() => {
                link.style.animation = '';
            }, 600);
        }
    });
}, 1000);

// Preload de recursos
function preloadResources() {
    const resources = [
        'assets/background-video.mp4',
        'assets/profile.jpg',
        'assets/background-music.mp3'
    ];

    resources.forEach(src => {
        if (src.includes('.mp4')) {
            const video = document.createElement('video');
            video.src = src;
        } else if (src.includes('.mp3')) {
            const audio = document.createElement('audio');
            audio.src = src;
        } else {
            const img = new Image();
            img.src = src;
        }
    });
}

// Inicializar preload
preloadResources();

// Easter eggs
let clickCount = 0;
document.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 10) {
        // Ativar modo rainbow
        document.body.style.filter = 'hue-rotate(0deg)';
        let hue = 0;
        const rainbowInterval = setInterval(() => {
            hue += 5;
            document.body.style.filter = `hue-rotate(${hue}deg)`;
            if (hue >= 360) {
                clearInterval(rainbowInterval);
                document.body.style.filter = 'none';
                clickCount = 0;
            }
        }, 50);
    }
});

// Extrair cores dominantes do vídeo de fundo
function extractDominantColors() {
    const bgVideo = document.getElementById('bg-video');
    
    // Se o vídeo estiver carregado, tentar extrair cores
    if (bgVideo && bgVideo.videoWidth > 0) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            
            ctx.drawImage(bgVideo, 0, 0, 100, 100);
            const imageData = ctx.getImageData(0, 0, 100, 100);
            const data = imageData.data;
            
            // Analisar pixels para encontrar cores dominantes
            let r = 0, g = 0, b = 0;
            const pixelCount = data.length / 4;
            
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
            }
            
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);
            
            // Criar paleta de cores baseada na cor dominante mas mantendo tema preto/branco
            const primary = `rgb(${Math.min(255, 200 + r/5)}, ${Math.min(255, 200 + g/5)}, ${Math.min(255, 200 + b/5)})`;
            const secondary = `rgb(${Math.min(255, 150 + r/3)}, ${Math.min(255, 150 + g/3)}, ${Math.min(255, 150 + b/3)})`;
            const accent = `rgb(${Math.min(255, 180 + r/4)}, ${Math.min(255, 180 + g/4)}, ${Math.min(255, 180 + b/4)})`;
            
            return { primary, secondary, accent };
        } catch (error) {
            console.log('Erro ao extrair cores do vídeo:', error);
        }
    }
    
    // Fallback para cores preto/branco
    return {
        primary: '#ffffff',
        secondary: '#cccccc',
        accent: '#ffffff'
    };
}

// Adaptar cores do texto baseado na intensidade do áudio
function adaptTextColors(intensity, dominantColors) {
    const username = document.querySelector('.username');
    const profileRing = document.querySelector('.profile-ring');
    const audioBtn = document.querySelector('.audio-btn');
    
    if (intensity > 100) {
        // Intensidade alta - usar cores mais vibrantes
        if (username) {
            username.style.textShadow = `
                0 0 5px ${dominantColors.primary},
                0 0 10px ${dominantColors.primary},
                0 0 15px ${dominantColors.secondary},
                0 0 20px ${dominantColors.secondary}
            `;
        }
        
        if (profileRing) {
            profileRing.style.background = `linear-gradient(45deg, ${dominantColors.primary}, ${dominantColors.accent}, ${dominantColors.secondary})`;
        }
        
        if (audioBtn) {
            audioBtn.style.borderColor = dominantColors.accent;
            audioBtn.style.color = dominantColors.accent;
        }
    } else {
        // Intensidade baixa - usar cores mais suaves
        if (username) {
            username.style.textShadow = `
                0 0 3px ${dominantColors.primary},
                0 0 6px ${dominantColors.primary},
                0 0 9px ${dominantColors.primary}
            `;
        }
        
        if (profileRing) {
            profileRing.style.background = `linear-gradient(45deg, ${dominantColors.primary}, ${dominantColors.secondary})`;
        }
    }
    
    // Atualizar cores das partículas hover
    updateHoverParticleColors(dominantColors.accent);
}

// Atualizar cores das partículas de hover
function updateHoverParticleColors(color) {
    const style = document.createElement('style');
    style.textContent = `
        .hover-particle {
            background: ${color} !important;
        }
    `;
    document.head.appendChild(style);
}

// Melhorar a função de criar partículas hover para usar cores adaptativas
function createHoverParticles(element) {
    const rect = element.getBoundingClientRect();
    const dominantColors = extractDominantColors();
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'hover-particle';
        particle.style.position = 'fixed';
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = dominantColors.accent;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        particle.style.boxShadow = `0 0 10px ${dominantColors.accent}`;
        
        document.body.appendChild(particle);
        
        // Animar partícula
        const angle = (Math.PI * 2 * i) / 5;
        const distance = 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => {
            particle.remove();
        };
    }
}

// Detectar se é mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
    // Ajustes para mobile
    document.body.style.cursor = 'auto';
    const customCursor = document.querySelector('.custom-cursor');
    if (customCursor) {
        customCursor.style.display = 'none';
    }
}
