class WavePlayground {
    constructor() {
        this.numWaves = 12;
        this.waves = [];
        this.activeWaveIndex = -1;
        this.lastShownWaveIndex = -1; // Track last shown wave for persistence
        this.time = 0;
        this.animationFrame = null;
        
        this.individualCanvas = document.getElementById('individualWave');
        this.sumCanvas = document.getElementById('sumWave');
        this.individualCtx = this.individualCanvas.getContext('2d');
        this.sumCtx = this.sumCanvas.getContext('2d');
        this.slidersContainer = document.getElementById('slidersContainer');
        this.individualLabel = document.getElementById('individualLabel');
        
        this.init();
    }
    
    init() {
        this.setupCanvases();
        this.createSliders();
        this.setupEventListeners();
        this.animate();
    }
    
    setupCanvases() {
        const resizeCanvases = () => {
            const dpr = window.devicePixelRatio || 1;
            
            // Individual wave canvas
            const individualRect = this.individualCanvas.getBoundingClientRect();
            this.individualCanvas.width = individualRect.width * dpr;
            this.individualCanvas.height = individualRect.height * dpr;
            this.individualCtx.scale(dpr, dpr);
            
            // Sum wave canvas
            const sumRect = this.sumCanvas.getBoundingClientRect();
            this.sumCanvas.width = sumRect.width * dpr;
            this.sumCanvas.height = sumRect.height * dpr;
            this.sumCtx.scale(dpr, dpr);
        };
        
        resizeCanvases();
        window.addEventListener('resize', resizeCanvases);
    }
    
    createSliders() {
        this.slidersContainer.innerHTML = '';
        this.waves = [];
        
        for (let i = 0; i < this.numWaves; i++) {
            const wave = {
                frequency: i + 1,
                amplitude: 0,
                targetAmplitude: 0
            };
            this.waves.push(wave);
            
            const sliderGroup = document.createElement('div');
            sliderGroup.className = 'slider-group';
            sliderGroup.dataset.frequency = i;
            
            sliderGroup.innerHTML = `
                <div class="slider-header">
                    <span class="frequency-label">Wave ${i + 1}</span>
                    <span class="frequency-value" id="value-${i}">0.00</span>
                </div>
                <input type="range" class="slider" id="slider-${i}" 
                       min="-1" max="1" step="0.01" value="0">
            `;
            
            this.slidersContainer.appendChild(sliderGroup);
            
            const slider = sliderGroup.querySelector('.slider');
            const valueDisplay = sliderGroup.querySelector('.frequency-value');
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                wave.targetAmplitude = value;
                valueDisplay.textContent = value.toFixed(2);
                this.updateSliderColor(slider, value);
                // Animation is running continuously, no need to call draw()
            });
            
            sliderGroup.addEventListener('mouseenter', () => {
                this.showIndividualWave(i);
                // Animation is running continuously, no need to call draw()
            });
            
            sliderGroup.addEventListener('mouseleave', () => {
                this.hideIndividualWave();
                // Animation is running continuously, no need to call draw()
            });
            
            slider.addEventListener('mousedown', () => {
                this.showIndividualWave(i);
                // Animation is running continuously, no need to call draw()
            });
            
            slider.addEventListener('mouseup', () => {
                setTimeout(() => {
                    this.hideIndividualWave();
                    // Animation is running continuously, no need to call draw()
                }, 100);
            });
        }
    }
    
    updateSliderColor(slider, value) {
        const intensity = Math.abs(value);
        const hue = value >= 0 ? 120 : 0; // Green for positive, red for negative
        const saturation = 50 + intensity * 50;
        const lightness = 50;
        
        slider.style.background = `linear-gradient(90deg, 
            hsl(${hue}, ${saturation}%, ${lightness}%) 0%, 
            hsl(${hue}, ${saturation}%, ${lightness - 20}%) 100%)`;
    }
    
    showIndividualWave(index) {
        this.activeWaveIndex = index;
        this.lastShownWaveIndex = index; // Update last shown wave
        this.individualCanvas.classList.add('active');
        
        // Update all slider groups to show active state
        document.querySelectorAll('.slider-group').forEach((group, i) => {
            if (i === index) {
                group.classList.add('active');
            } else {
                group.classList.remove('active');
            }
        });
        
        // Update individual wave label
        const wave = this.waves[index];
        document.querySelector('.individual-label .label-text').textContent = 
            `Wave ${index + 1} (freq: ${wave.frequency})`;
    }
    
    hideIndividualWave() {
        this.activeWaveIndex = -1;
        // Don't clear the canvas, keep showing the last wave
        // Don't remove active class from canvas to keep it visible
        
        document.querySelectorAll('.slider-group').forEach(group => {
            group.classList.remove('active');
        });
        
        document.querySelector('.individual-label .label-text').textContent = 'Individual Wave';
    }
    
    setupEventListeners() {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });
    }
    
    applyPreset(preset) {
        const presets = {
            square: () => {
                // Square wave approximation: odd harmonics with decreasing amplitude
                for (let i = 0; i < this.numWaves; i++) {
                    const harmonic = i + 1;
                    if (harmonic % 2 === 1) {
                        const amplitude = 4 / (Math.PI * harmonic);
                        this.setWaveAmplitude(i, amplitude);
                    } else {
                        this.setWaveAmplitude(i, 0);
                    }
                }
            },
            sawtooth: () => {
                // Sawtooth wave: all harmonics with decreasing amplitude
                for (let i = 0; i < this.numWaves; i++) {
                    const harmonic = i + 1;
                    const amplitude = 2 / (Math.PI * harmonic) * (i % 2 === 0 ? 1 : -1);
                    this.setWaveAmplitude(i, amplitude);
                }
            },
            triangle: () => {
                // Triangle wave: odd harmonics with alternating signs and faster decay
                for (let i = 0; i < this.numWaves; i++) {
                    const harmonic = i + 1;
                    if (harmonic % 2 === 1) {
                        const sign = Math.floor(harmonic / 2) % 2 === 0 ? 1 : -1;
                        const amplitude = sign * 8 / (Math.PI * Math.PI * harmonic * harmonic);
                        this.setWaveAmplitude(i, amplitude);
                    } else {
                        this.setWaveAmplitude(i, 0);
                    }
                }
            },
            reset: () => {
                for (let i = 0; i < this.numWaves; i++) {
                    this.setWaveAmplitude(i, 0);
                }
            }
        };
        
        if (presets[preset]) {
            presets[preset]();
            // Animation is running continuously, no need to call draw()
        }
    }
    
    setWaveAmplitude(index, amplitude) {
        const wave = this.waves[index];
        wave.targetAmplitude = Math.max(-1, Math.min(1, amplitude));
        
        const slider = document.getElementById(`slider-${index}`);
        const valueDisplay = document.getElementById(`value-${index}`);
        
        slider.value = wave.targetAmplitude;
        valueDisplay.textContent = wave.targetAmplitude.toFixed(2);
        this.updateSliderColor(slider, wave.targetAmplitude);
    }
    
    drawWave(ctx, canvas, waveData, color = '#3b82f6', lineWidth = 2) {
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Vertical lines
        for (let x = 0; x <= width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // Draw wave
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const t = (x / width) * 4 * Math.PI; // Show 2 periods
            const y = height / 2 - waveData[x] * (height / 2 - 20);
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    generateWaveData(frequency, amplitude, phase, width) {
        const data = [];
        for (let x = 0; x < width; x++) {
            const t = (x / width) * 4 * Math.PI;
            const y = amplitude * Math.sin(frequency * t + phase);
            data.push(y);
        }
        return data;
    }
    
    generateStaticWaveData(frequency, amplitude, width) {
        const data = [];
        for (let x = 0; x < width; x++) {
            const t = (x / width) * 4 * Math.PI;
            const y = amplitude * Math.sin(frequency * t);
            data.push(y);
        }
        return data;
    }
    
    generateWobblyWaveData(frequency, amplitude, width, time) {
        const data = [];
        for (let x = 0; x < width; x++) {
            const t = (x / width) * 4 * Math.PI;
            // Main wave with tiny wobble
            const wobble = 0.02 * Math.sin(time * 2 + x * 0.01); // Very subtle wobble
            const y = amplitude * Math.sin(frequency * t) * (1 + wobble);
            data.push(y);
        }
        return data;
    }
    
    animate() {
        this.time += 0.01; // Slow animation for subtle effect
        
        // Smooth amplitude transitions
        this.waves.forEach(wave => {
            const diff = wave.targetAmplitude - wave.amplitude;
            wave.amplitude += diff * 0.1; // Smooth transition
        });
        
        const width = this.sumCanvas.width / (window.devicePixelRatio || 1);
        
        // Draw individual wave if active or if there's a last shown wave (with wobble)
        if (this.activeWaveIndex >= 0 || this.lastShownWaveIndex >= 0) {
            const waveIndex = this.activeWaveIndex >= 0 ? this.activeWaveIndex : this.lastShownWaveIndex;
            const wave = this.waves[waveIndex];
            const waveData = this.generateWobblyWaveData(
                wave.frequency, 
                wave.amplitude, 
                width,
                this.time
            );
            this.drawWave(this.individualCtx, this.individualCanvas, waveData, '#ec4899', 3);
        }
        
        // Draw sum of all waves (with subtle wobble)
        const sumData = [];
        for (let x = 0; x < width; x++) {
            let sum = 0;
            const t = (x / width) * 4 * Math.PI;
            const wobble = 0.015 * Math.sin(this.time * 1.5 + x * 0.008); // Even more subtle for sum
            
            this.waves.forEach(wave => {
                sum += wave.amplitude * Math.sin(wave.frequency * t) * (1 + wobble);
            });
            sumData.push(sum);
        }
        
        this.drawWave(this.sumCtx, this.sumCanvas, sumData, '#0ea5e9', 3);
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// Initialize the playground when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WavePlayground();
});
