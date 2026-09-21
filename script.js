"use strict";

// ==========================================
//  Simulation d'ondes circulaires (canvas)
//  - Une seule classe propre
//  - Cases à cocher Source / A / B fonctionnelles
//  - Pas de grille sur le canvas principal
//  - Bouton ou clic sur le canvas pour démarrer
// ==========================================

class WaveSimulation {
	
  constructor() {
    // --------------------
    // Paramètres physiques
    // --------------------

    this.frequency = 20.0;      // Hz
    this.amplitude = 5.0;      // mm (affichage)
   	this.velocity = 10;           // valeur physique affichée
    this.velocityVisual = 1000;   // valeur pour le rendu visuel
    this.animationSpeed = 0.1; // multiplicateur de temps

//Facteur d'échelle pour l'affichage graphique
   this.displayScale = 20; // Ajuste si tu veux zoomer plus ou moins
   this.wavelengthDisplay = this.wavelength * this.displayScale;
   this.period     = 1 / this.frequency;             // s
   this.startDirection = "up"; // sens de départ
    // --------------------
    // État d'animation
    // --------------------
    this.time = 0;
    this.isRunning = false;
    this.animationId = null;
    this.lastTime = 0;
    // Sens de départ de la source
    this.startDirection = "up"; // ou "down"
    // --------------------
    // Historique (pour le diagramme)
    // --------------------
    this.MAX_TRACE = 2000;
    this.sourceTimes = [];
    this.sourceDisp  = [];

   this.pointA = { x: 200, y: 300, color: "red",   times: [], trace: [] };
    this.pointB = { x: 400, y: 300, color: "green", times: [], trace: [] };

    // --------------------
    // DOM
    // --------------------
	const toggleDiagramBtn = document.getElementById("toggleDiagramBtn");
    const diagramOptions = document.getElementById("diagramOptions");

   if (toggleDiagramBtn && diagramOptions) {
   toggleDiagramBtn.addEventListener("click", () => {
    diagramOptions.classList.toggle("hidden");
  });
}
    this.mainCanvas  = document.getElementById("mainCanvas");
    this.diagramCanvas  = document.getElementById("diagramCanvas");
    this.crossSectionCanvas = document.getElementById("crossSectionCanvas");
    this.showCrossSection = false;
    this.mainCtx = this.mainCanvas.getContext('2d');
    this.crossSectionCtx = this.crossSectionCanvas.getContext('2d');
    if (!this.mainCanvas || !this.diagramCanvas || !this.crossSectionCanvas) {
     
      return;
    }
    this.diagramCtx     = this.diagramCanvas.getContext("2d");
       
    // Boutons / sliders
	    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.resetBtn     = document.getElementById("resetBtn");
    this.toggleDiagramBtn = document.getElementById("toggleDiagramBtn");
    this.crossSectionBtn = document.getElementById("crossSectionBtn");
    this.stepBackBtn = document.getElementById("stepBackBtn");
    this.stepForwardBtn = document.getElementById("stepForwardBtn");
    this.togglePointsBtn = document.getElementById("togglePointsBtn");
    this.startDirectionSelect = document.getElementById("startDirection");
    this.frequencySlider = document.getElementById("frequencySlider");
    this.amplitudeSlider = document.getElementById("amplitudeSlider");
    this.speedSlider   = document.getElementById("speedSlider");
	this.crossSectionCanvas = document.getElementById("crossSectionCanvas");
    this.crossSectionCtx = this.crossSectionCanvas ? this.crossSectionCanvas.getContext("2d") : null;

    this.frequencyValue = document.getElementById("frequencyValue");
    this.amplitudeValue = document.getElementById("amplitudeValue");
    this.speedValue     = document.getElementById("speedValue");
    this.periodValue    = document.getElementById("periodValue");
    this.wavelengthValue= document.getElementById("wavelengthValue");
    this.velocityValue  = document.getElementById("velocityValue");
    this.startDirection = "up";
	this.startDirectionSelect = document.getElementById('startDirection');
    this.togglePointsBtn = document.getElementById('togglePointsBtn');
		
		 // Vue de coupe transversale
    this.crossSectionView = document.getElementById('crossSectionView');
    this.crossSectionBtn = document.getElementById("crossSectionBtn");
    this.crossSectionCanvas = document.getElementById("crossSectionCanvas");
    this.crossSectionCtx = this.crossSectionCanvas ? this.crossSectionCanvas.getContext("2d") : null;
	 // --- Tooltips for diagram button (optional) ---
    const tooltip = document.getElementById("tooltip");
    if (this.toggleDiagramBtn && tooltip) {
      this.toggleDiagramBtn.addEventListener("mousemove", (e) => {
        tooltip.style.display = "block";
        tooltip.textContent = " afficher/cacher diagrammes ";
        tooltip.style.left = (e.pageX + 12) + "px";
        tooltip.style.top = (e.pageY + 12) + "px";
      });
      this.toggleDiagramBtn.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
    }
    // Cases à cocher (diagramme)
    

    this.srcBox = document.getElementById("toggleSourceTrace");
    this.aBox   = document.getElementById("toggleATrace");
    this.bBox   = document.getElementById("toggleBTrace");

    // Affichage du diagramme
   this.showSourceTrace =false;
    this.showATrace = false;
    this.showBTrace = false;
	
    // Coupe transversale (simple on/off, pas de détails ici)
    this.showCrossSectionCanvas = false;

    // Ecouteurs
    this.attachUIListeners();

window.onload = function() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
};

    // Première mise à jour
    this.updateCalculatedParameters();{
	
  // Calcul physique (valeurs affichées)
  const velocity = 10; // cm/s (réaliste)
  this.wavelength = this.velocity / this.frequency;
  this.period = 1 / this.frequency;
  // Pour le dessin on garde la grande valeur
  this.wavelengthDisplay = (this.velocityVisual || 1000) / this.frequency;
  this.wavelengthDisplay = this.wavelength * (this.displayScale || 1);
  } 
 this.draw();
  }
  // ------------------------------------------------
  // Listeners d'UI — une seule fois, sans doublons
  // ------------------------------------------------
    
  attachUIListeners() {
    // Boutons
	this.showPoints = false;
	//this.crossSectionView.classList.remove('visible');
	// Infobulles au survol
  this.mainCanvas.addEventListener("mousemove", (e) => {
  const pos = this.getMousePos(e);
  const radius = 12; // tolérance autour des points
  let hovering = null;

  [this.pointA, this.pointB].forEach(pt => {
    const dx = pos.x - pt.x;
    const dy = pos.y - pt.y;
    if (Math.sqrt(dx*dx + dy*dy) < radius) {
      hovering = pt;
    }
  });

  const tooltipA = document.getElementById("tooltipA");
  const tooltipB = document.getElementById("tooltipB");
  if (tooltipA && tooltipB) {
    if (hovering === this.pointA) {
      this.showTooltipForPoint(this.pointA, tooltipA, "A");
      tooltipA.style.display = "block";
      tooltipB.style.display = "none";
    } else if (hovering === this.pointB) {
      this.showTooltipForPoint(this.pointB, tooltipB, "B");
      tooltipB.style.display = "block";
      tooltipA.style.display = "none";
    } else {
      tooltipA.style.display = "none";
      tooltipB.style.display = "none";
    }
  }
});

this.mainCanvas.addEventListener("mouseleave", () => {
  const tooltipA = document.getElementById("tooltipA");
  const tooltipB = document.getElementById("tooltipB");
  if (tooltipA) tooltipA.style.display = "none";
  if (tooltipB) tooltipB.style.display = "none";
});
      if (this.crossSectionBtn) {
    this.crossSectionBtn.addEventListener('click', () => this.toggleCrossSection());
	 this.stepBackBtn.addEventListener('click', () => this.stepBack());
	 this.stepForwardBtn.addEventListener('click', () => this.stepForward());
	 this.togglePointsBtn.addEventListener('click', () => {
     this.showPoints = !this.showPoints;
     this.togglePointsBtn.innerHTML = this.showPoints ? '❌ Cacher points' : '🔵 Afficher points ';
    this.draw();
  });
}
   if (this.startDirectionSelect) {
            this.startDirectionSelect.addEventListener('change', (e) => {
                this.startDirection = e.target.value;
            });
        }
   if (this.playPauseBtn) this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    if (this.resetBtn)     this.resetBtn.addEventListener("click", () => this.reset());
   if (this.toggleDiagramBtn) {
      this.toggleDiagramBtn.addEventListener("click", () => {
        this.showDiagram = !this.showDiagram;
        this.diagramCanvas.style.display = this.showDiagram ? "block" : "none";
        this.draw();
      });
    }

    // Clic sur le canvas principal pour démarrer / pause
    this.mainCanvas.addEventListener("click", () => this.togglePlayPause());

    // Sliders
    if (this.frequencySlider) {
    this.frequencySlider.addEventListener("input", (e) => {
    this.frequency = parseFloat(e.target.value);
    this.updateCalculatedParameters();   // 🔑 recalcul période + λ
    this.updateDisplay();                // 🔑 met à jour l’affichage
  });
}
    if (this.amplitudeSlider) {
      this.amplitudeSlider.value = String(this.amplitude);
      this.amplitudeSlider.addEventListener("input", (e) => {
      this.amplitude = parseFloat(e.target.value);
      this.updateDisplay();
      });
    }
    if (this.speedSlider) {
      this.speedSlider.value = String(this.animationSpeed);
      this.speedSlider.addEventListener("input", (e) => {
        this.animationSpeed = parseFloat(e.target.value);
        this.updateDisplay();
      });
    }

    // Cases à cocher
    if (this.srcBox) {
      this.srcBox.checked = this.showSourceTrace;
      this.srcBox.addEventListener("change", (e) => { this.showSourceTrace = e.target.checked; this.draw(); });
    }
    if (this.aBox) {
      this.aBox.checked = this.showATrace;
      this.aBox.addEventListener("change", (e) => { this.showATrace = e.target.checked; this.draw(); });
    }
    if (this.bBox) {
      this.bBox.checked = this.showBTrace;
      this.bBox.addEventListener("change", (e) => { this.showBTrace = e.target.checked; this.draw(); });
    }

    // Drag & drop des points A/B quand on est à l'arrêt
    this.draggingPoint = null;
    this.mainCanvas.addEventListener("mousedown", (e) => this.startDrag(e));
    this.mainCanvas.addEventListener("mousemove", (e) => this.drag(e));
    this.mainCanvas.addEventListener("mouseup",   () => this.stopDrag());
    this.mainCanvas.addEventListener("mouseleave",() => this.stopDrag());
  }
 updateTooltips() {
    const tooltipA = document.getElementById("tooltipA");
    const tooltipB = document.getElementById("tooltipB");
    const pixelsPerCm = 200;
    if (!tooltipA || !tooltipB) return;

    const xA_cm = ((this.pointA.x - this.mainCanvas.width / 2) / pixelsPerCm);
    const xB_cm = (this.pointB.x - this.mainCanvas.width / 2) / pixelsPerCm;
    const xA_lambda = (xA_cm / this.wavelength).toFixed(2);
    const xB_lambda = (xB_cm / this.wavelength).toFixed(2);

    tooltipA.style.left = (this.pointA.x + this.mainCanvas.offsetLeft + 15) + "px";
    tooltipA.style.top = (this.pointA.y + this.mainCanvas.offsetTop - 10) + "px";
    tooltipA.textContent = `xA = ${xA_lambda} λ`;
    tooltipA.style.display = (this.draggingPoint === this.pointA) ? "block" : "none";

    tooltipB.style.left = (this.pointB.x + this.mainCanvas.offsetLeft + 15) + "px";
    tooltipB.style.top = (this.pointB.y + this.mainCanvas.offsetTop - 10) + "px";
    tooltipB.textContent = `xB = ${xB_lambda} λ`;
    tooltipB.style.display = (this.draggingPoint === this.pointB) ? "block" : "none";
  }
  // ------------------------------------------------
  // Helpers drag & drop
  // ------------------------------------------------
 getMousePos(evt) {
    const rect = this.mainCanvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
	
  }
showTooltipForPoint(pt, tooltip, label) {
  const pixelsPerCm = 200;
  const x_cm = (pt.x - this.mainCanvas.width / 2) / pixelsPerCm;
  const x_lambda = Math.abs((x_cm / this.wavelength).toFixed(2));

  tooltip.style.left = (pt.x + this.mainCanvas.offsetLeft + 15) + "px";
  tooltip.style.top = (pt.y + this.mainCanvas.offsetTop - 10) + "px";
  tooltip.textContent = ` x ${label}= ${x_lambda} λ`;
}

  startDrag(evt) {
    if (this.isRunning) return;
    const pos = this.getMousePos(evt);
    [this.pointA, this.pointB].forEach(pt => {
      const dx = pos.x - pt.x;
      const dy = pos.y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) < 12) this.draggingPoint = pt;
    });
  }

  drag(evt) {
    if (!this.draggingPoint) return;
    const pos = this.getMousePos(evt);
    this.draggingPoint.x = pos.x;
    this.draggingPoint.y = pos.y;
    this.draw();
    this.updateTooltips();
	
  }

  stopDrag() {
    this.draggingPoint = null;
    const tA = document.getElementById("tooltipA");
    const tB = document.getElementById("tooltipB");
    if (tA) tA.style.display = "none";
    if (tB) tB.style.display = "none";
  }

  updateTooltips() {
    const tooltipA = document.getElementById("tooltipA");
    const tooltipB = document.getElementById("tooltipB");
    const pixelsPerCm = 200;
    if (!tooltipA || !tooltipB) return;

    const xA_cm = -(this.pointA.x - this.mainCanvas.width / 2) / pixelsPerCm;
    const xB_cm = (this.pointB.x - this.mainCanvas.width / 2) / pixelsPerCm;
    const xA_lambda = (xA_cm / this.wavelength).toFixed(2);
    const xB_lambda = (xB_cm / this.wavelength).toFixed(2);

    tooltipA.style.left = (this.pointA.x + this.mainCanvas.offsetLeft + 15) + "px";
    tooltipA.style.top = (this.pointA.y + this.mainCanvas.offsetTop - 10) + "px";
    tooltipA.textContent = `xA = ${xA_lambda} λ`;
    tooltipA.style.display = (this.draggingPoint === this.pointA) ? "block" : "none";

    tooltipB.style.left = (this.pointB.x + this.mainCanvas.offsetLeft + 15) + "px";
    tooltipB.style.top = (this.pointB.y + this.mainCanvas.offsetTop - 10) + "px";
    tooltipB.textContent = `xB = ${xB_lambda} λ`;
    tooltipB.style.display = (this.draggingPoint === this.pointB) ? "block" : "none";
  }


  // ------------------------------------------------
  // Calculs / affichage
  // ------------------------------------------------
  
 updateCalculatedParameters() {
  // Calcul physique (valeurs affichées)
  const velocity = 10; // cm/s (réaliste)
  this.wavelength = velocity / this.frequency;
  this.period = 1 / this.frequency;
  this.wavelengthDisplay = this.wavelength * this.displayScale;

}
  updateDisplay() {
	if (this.frequencyValue)  this.frequencyValue.textContent  = `${this.frequency.toFixed(1)} Hz`;
    if (this.periodValue)     this.periodValue.textContent     = `${this.period.toFixed(2)} s`;
    if (this.wavelengthValue) this.wavelengthValue.textContent = `${(this.wavelength||0).toFixed(1)} cm`;
    if (this.amplitudeValue)  this.amplitudeValue.textContent  = `${this.amplitude.toFixed(1)} mm`;
   // if (this.speedValue)      this.speedValue.textContent      = `${this.animationSpeed.toFixed(1)}×`;    
    if (this.velocityVisualValue)   this.velocityVisualValue.textContent   = `${this.velocityVisual.toFixed(1)} cm/s`;

  }
  drawCrossSection() {
  if (!this.crossSectionCtx) return;
  const ctx = this.crossSectionCtx;
  const width = this.crossSectionCanvas.width;
  const height = this.crossSectionCanvas.height;

  ctx.clearRect(0,0,width,height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0,0,width,height);

    const centerY = height / 2;
        const centerX = width / 2; // position de la source
        const pixelsPerCm = 10; 
        const currentTime = this.crossSectionFrozen ? this.frozenTime : this.time;

        // ✅ Calcul du front d’onde
      // Front d'onde agrandi pour correspondre à l'échelle graphique
const currentFrontRadiusCm = this.velocity * currentTime*this.displayScale ;


       // ---- Courbe gauche ----
const leftPoints = [];
for (let x = centerX; x >= 50; x -= 2) {
    const distanceCm = 2*(centerX - x) / this.displayScale;
    if (distanceCm > currentFrontRadiusCm) {
        // Eau calme avant l’arrivée du front
        leftPoints.push({ x, y: centerY, amplitude: 0 });
        continue;
    }
    const phase = 2 * Math.PI * (this.frequency * currentTime - distanceCm / this.wavelengthDisplay) + ((this.startDirection === "up") ? 0 : Math.PI);
    const amplitude = this.amplitude * Math.sin(phase);
    const y = centerY - amplitude * 2;
    leftPoints.push({ x, y, amplitude });
}
// ---- Courbe droite ----
const rightPoints = [];
for (let x = centerX; x <= width - 50; x += 2) {
    const distanceCm = 2*(x - centerX) / this.displayScale;
    if (distanceCm > currentFrontRadiusCm) {
        rightPoints.push({ x, y: centerY, amplitude: 0 });
        continue;
    }
    const phase = 2 * Math.PI * (this.frequency * currentTime - distanceCm / this.wavelengthDisplay)  + ((this.startDirection === "up") ? 0 : Math.PI);
    const amplitude = this.amplitude * Math.sin(phase);
    const y = centerY - amplitude * 2;
    rightPoints.push({ x, y, amplitude });
}
        // ---- Fond ----
        ctx.clearRect(0, 0, width, height);
        const gradientFond = ctx.createLinearGradient(0, 0, 0, height);
        gradientFond.addColorStop(0, '#e1f5fe');
        gradientFond.addColorStop(0.5, '#b3e5fc');
        gradientFond.addColorStop(1, '#81d4fa');
        ctx.fillStyle = gradientFond;
        ctx.fillRect(0, 0, width, height);

        // ---- Surface gauche ----
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (leftPoints.length > 0) {
            ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
            for (const p of leftPoints) ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // ---- Surface droite ----
        ctx.beginPath();
        if (rightPoints.length > 0) {
            ctx.moveTo(rightPoints[0].x, rightPoints[0].y);
            for (const p of rightPoints) ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // ✅ Source au centre
        // ✅ Calcul offset pour vibration de la source
        let sourceOffset = 0;
        
// ✅ Source vibrante dépend du temps, même en pause
 sourceOffset = 0;
const phase = 2 * Math.PI * this.frequency * currentTime;
sourceOffset = this.amplitude * 2 * Math.sin(phase + ((this.startDirection === "up") ? 0 : Math.PI));


        // ✅ Source vibrante
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(centerX, centerY - sourceOffset, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Source', centerX, centerY - sourceOffset + 20);

        // ✅ Points optionnels
        if (this.showPoints) {
            ctx.fillStyle = '#060544';
            const step = 10;
            for (let i = 0; i < leftPoints.length; i += step) {
                ctx.beginPath();
                ctx.arc(leftPoints[i].x, leftPoints[i].y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
            for (let i = 0; i < rightPoints.length; i += step) {
                ctx.beginPath();
                ctx.arc(rightPoints[i].x, rightPoints[i].y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // ✅ Axes & graduations
        
        this.drawCrossSectionAxes(ctx, width, height, pixelsPerCm, currentTime, currentFrontRadiusCm);
        //this.drawCrossSectionGraduations(ctx, width, height, pixelsPerCm, centerX);
    }
    
    
    drawCrossSectionAxes(ctx, width, height, pixelsPerCm, currentTime, currentFrontRadiusCm) {
        const centerY = height / 2;
        const centerX = width / 2;
        
        // Axe horizontal (position)
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, centerY);
        ctx.lineTo(width - 50, centerY);
        ctx.stroke();
             
        // Labels des axes
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Distance depuis la source (cm)', width / 2, height - 5);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Amplitude (mm)', 0, 0);
        ctx.restore();
 // Axe vertical (amplitude) au centre (position de la source)
        ctx.beginPath();
        ctx.moveTo(centerX, 20);
        ctx.lineTo(centerX, height - 20);
        ctx.stroke();
       
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 30, centerY - 30);
        ctx.lineTo(centerX - 60, centerY - 30);
        ctx.stroke();
        
        // Pointe de la flèche gauche
        ctx.beginPath();
        ctx.moveTo(centerX - 60, centerY - 30);
        ctx.lineTo(centerX - 55, centerY - 35);
        ctx.moveTo(centerX - 60, centerY - 30);
        ctx.lineTo(centerX - 55, centerY - 25);
        ctx.stroke();
        
        // Flèche indiquant la direction de propagation vers la droite
        ctx.beginPath();
        ctx.moveTo(centerX + 30, centerY - 30);
        ctx.lineTo(centerX + 60, centerY - 30);
        ctx.stroke();
        
        // Pointe de la flèche droite
        ctx.beginPath();
        ctx.moveTo(centerX + 60, centerY - 30);
        ctx.lineTo(centerX + 55, centerY - 35);
        ctx.moveTo(centerX + 60, centerY - 30);
        ctx.lineTo(centerX + 55, centerY - 25);
        ctx.stroke();
        
        // Label de direction
        ctx.fillStyle = '#e74c3c';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Propagation', centerX - 45, centerY - 40);
        ctx.fillText('bidirectionnelle', centerX + 45, centerY - 40);
         
        let dissipationFactor=1 //w3
		
     // ---- Courbe gauche ----
const leftPoints = [];

for (let x = centerX; x >= 50; x -= 2) {
    const distanceCm = 2*(centerX - x) / this.displayScale;;
    if (distanceCm > currentFrontRadiusCm) {
        leftPoints.push({ x, y: centerY, amplitude: 0 });
        continue;
    }
    const phase = 2 * Math.PI * (this.frequency * currentTime - distanceCm / this.wavelengthDisplay)
                + ((this.startDirection === "up") ? 0 : Math.PI);
    const amplitude = this.amplitude * Math.sin(phase);
    const y = centerY - amplitude * 2;
    leftPoints.push({ x, y, amplitude });
}

// ---- Courbe droite ----
const rightPoints = [];

for (let x = centerX; x <= width - 50; x += 2) {
    const distanceCm = 2*(x - centerX) / this.displayScale;;
    if (distanceCm > currentFrontRadiusCm) {
        rightPoints.push({ x, y: centerY, amplitude: 0 });
        continue;
    }
    const phase = 2 * Math.PI * (this.frequency * currentTime - distanceCm / this.wavelengthDisplay)
                + ((this.startDirection === "up") ? 0 : Math.PI);
    const amplitude = this.amplitude * Math.sin(phase);
    const y = centerY - amplitude * 2;
    rightPoints.push({ x, y, amplitude });
}

// --- Fond eau ---
const waterGradient = ctx.createLinearGradient(0, centerY, 0, height);
waterGradient.addColorStop(0, 'rgba(52, 152, 219, 0.6)');
waterGradient.addColorStop(1, 'rgba(52, 152, 219, 0.4)');
ctx.fillStyle = waterGradient;
ctx.fillRect(50, centerY, width - 100, height - centerY);

// --- Crêtes (bleu) ---
ctx.fillStyle = 'rgba(52, 152, 219, 0.7)';
[leftPoints, rightPoints].forEach(points => {
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i].amplitude > 0 && points[i + 1].amplitude > 0) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, centerY);
            ctx.lineTo(points[i].x, points[i].y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            ctx.lineTo(points[i + 1].x, centerY);
            ctx.closePath();
            ctx.fill();
        }
    }
});

// --- Creux (blanc) ---
ctx.fillStyle = '#c0ebec';
[leftPoints, rightPoints].forEach(points => {
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i].amplitude < 0 && points[i + 1].amplitude < 0) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, centerY);
            ctx.lineTo(points[i].x, points[i].y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            ctx.lineTo(points[i + 1].x, centerY);
            ctx.closePath();
            ctx.fill();
        }
    }
});

        // Dessiner les graduations
        this.drawCrossSectionGraduations(ctx, width, height, pixelsPerCm, centerX);    

    }
    
    drawCrossSectionGraduations(ctx, width, height, pixelsPerCm, centerX) {
        const centerY = height / 2;
        const wavelengthPixels = this.wavelengthDisplay * pixelsPerCm;
        
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 1;
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        
        // Graduations de longueur d'onde vers la gauche depuis la source
        for (let i = 1; i <= 5; i++) {
            const x = centerX - i * wavelengthPixels;
            if (x >= 50) {
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(x, 20);
                ctx.lineTo(x, height - 20);
                ctx.stroke();
                
                ctx.fillText(`${i}λ`, x, height - 25);
            }
        }
        
        // Graduations de longueur d'onde vers la droite depuis la source
        for (let i = 1; i <= 5; i++) {
            const x = centerX + i * wavelengthPixels;
            if (x <= width - 50) {
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(x, 20);
                ctx.lineTo(x, height - 20);
                ctx.stroke();
                
                ctx.fillText(`${i}λ`, x, height - 25);
            }
        }
        
        // Graduations d'amplitude
        for (let i = -2; i <= 2; i++) {
            if (i !== 0) {
                const y = centerY - i * this.amplitude * 2;
                if (y > 20 && y < height - 20) {
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.moveTo(50, y);
                    ctx.lineTo(width - 50, y);
                    ctx.stroke();
                    
                    ctx.textAlign = 'right';
                    ctx.fillText(`${i * this.amplitude}mm`, 45, y + 3);
                }
            }
        }
        
        // Ligne de référence horizontale (niveau zéro)
        ctx.setLineDash([]);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, centerY);
        ctx.lineTo(width - 50, centerY);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
  // ------------------------------------------------
  // Lecture / Pause / Reset / Animate
  // ------------------------------------------------
  play() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    if (this.playPauseBtn) this.playPauseBtn.textContent = "⏸ Pause";
    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.playPauseBtn) this.playPauseBtn.textContent = "▶ Démarrer";
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
  }

  togglePlayPause() { this.isRunning ? this.pause() : this.play(); }

 stepBack() {
        this.time -= 0.001; // Reculer de 0.01 seconde
        if (this.time < 0) this.time = 0;
        this.draw();
    }
    
    stepForward() {
        this.time += 0.001; // Avancer de 0.01 seconde
        this.draw();
    }
  reset() {
    this.pause();
    this.time = 0;
    // Vider proprement les historiques
    this.sourceTimes.length = 0; this.sourceDisp.length = 0;
    this.pointA.times.length = 0; this.pointA.trace.length = 0;
    this.pointB.times.length = 0; this.pointB.trace.length = 0;
    this.draw();
  }
 toggleCrossSection() {
	        this.showCrossSection = !this.showCrossSection;
        if (this.showCrossSection) {
            this.crossSectionView.classList.add('visible');
          this.crossSectionBtn.innerHTML = '👁 Masquer coupe';
        } else {
            this.crossSectionView.classList.remove('visible');
            this.crossSectionBtn.innerHTML = '👁 Coupe transversale';
        }
    }
  animate(now) {
    if (!this.isRunning) return;
    const dt = Math.max(0, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.time += dt * this.animationSpeed;

    // Mettre à jour les historiques avant d'afficher
    this.updateTraces();
    this.draw();
    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  updateTraces() {
    // Source
    const phase0 = 2 * Math.PI * this.frequency * this.time + (this.startDirection === "up" ? 0 : Math.PI);
    const srcAmp = this.amplitude * Math.sin(phase0);
    this.sourceTimes.push(this.time);
    this.sourceDisp.push(srcAmp);

    // Points A & B (retard de propagation)
    const cx = this.mainCanvas.width / 2, cy = this.mainCanvas.height / 2;
    const displayScale = 200; 
    const upd = (pt) => {
      const dx = (pt.x - cx) / displayScale;
      const dy = (pt.y - cy) / displayScale;
      const d  = Math.hypot(dx, dy); // cm
      const delay = d / this.velocity; // s
      let amp = 0;
      if (this.time >= delay) {
        const ph = 2 * Math.PI * this.frequency * (this.time - delay) + (this.startDirection === "up" ? 0 : Math.PI);
        amp = this.amplitude * Math.sin(ph);
      }
      pt.times.push(this.time);
      pt.trace.push(amp);
      if (pt.times.length > this.MAX_TRACE) { pt.times.shift(); pt.trace.shift(); }
    };
    upd(this.pointA); upd(this.pointB);

    // Taille maximale pour la source
    if (this.sourceTimes.length > this.MAX_TRACE) { this.sourceTimes.shift(); this.sourceDisp.shift(); }
  }

  // ------------------------------------------------
  // Dessins
  // ------------------------------------------------
  
draw() {
  this.drawMainView();
  if (this.showDiagram) this.drawDiagram();
  if (this.showCrossSection) this.drawCrossSection(); // ✅ ajout
  // mise à jour de l'afficheur chrono
document.getElementById("chrono").innerText =
  `t = ${(this.time * 1000).toFixed(0)} ms`;

}

  drawMainView() {
	 	  
    const ctx = this.mainCtx, W = this.mainCanvas.width, H = this.mainCanvas.height;
    const cx = W/2, cy = H/2;

    // Fond (sans grille)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W,H)/2);
    g.addColorStop(0, "#e3f2fd");
    g.addColorStop(1, "#90caf9");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // Ondes circulaires
    this.drawCircularWaves(ctx, cx, cy);

    // Source visuelle
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2); ctx.fill();

    // Points A & B (pour repère)
    this.drawPoint(ctx, this.pointA);
    this.drawPoint(ctx, this.pointB);
	// Point A en rouge + libellé
ctx.fillStyle = "red";
ctx.beginPath();
ctx.arc(this.pointA.x, this.pointA.y, 6, 0, 2 * Math.PI);
ctx.fill();
ctx.fillStyle = "red";
ctx.font = "14px Arial";
ctx.fillText("A", this.pointA.x + 10, this.pointA.y - 10);

// Point B en vert + libellé
ctx.fillStyle = "green";
ctx.beginPath();
ctx.arc(this.pointB.x, this.pointB.y, 6, 0, 2 * Math.PI);
ctx.fill();
ctx.fillStyle = "green";
ctx.font = "14px Arial";
ctx.fillText("B", this.pointB.x + 10, this.pointB.y - 10);
// Ondes circulaires
this.drawCircularWaves(ctx, cx, cy);

// ✅ Axe gradué en λ au milieu des rides
const pxPerCm = 10;
const wavelengthPx = this.wavelengthDisplay * pxPerCm;
const currentFront = this.velocity * this.time * pxPerCm;

ctx.strokeStyle = "#2c3e50";
ctx.lineWidth = 0.5;

ctx.setLineDash([6, 6]); // 6px trait, 4px espace

// ligne horizontale
ctx.beginPath();
ctx.moveTo(0, cy);
ctx.lineTo(W, cy);
ctx.stroke();

// remettre en continu pour ne pas affecter le reste
ctx.setLineDash([]);

// ligne horizontale
ctx.beginPath();
ctx.moveTo(0, cy);
ctx.lineTo(W, cy);
ctx.stroke();

// graduations à gauche et à droite de la source
ctx.fillStyle = "#2c3e50";
ctx.font = "12px Arial";
ctx.textAlign = "center";

for (let i = 1; i <= 5; i++) {
  // à droite
  let xRight = cx + i * wavelengthPx;
  if (xRight < W) {
    ctx.beginPath();
    ctx.moveTo(xRight, cy - 5);
    ctx.lineTo(xRight, cy + 5);
    ctx.stroke();
    ctx.fillText(`${i}λ`, xRight, cy + 18);
  }

  // à gauche
  let xLeft = cx - i * wavelengthPx;
  if (xLeft > 0) {
    ctx.beginPath();
    ctx.moveTo(xLeft, cy - 5);
    ctx.lineTo(xLeft, cy + 5);
    ctx.stroke();
    ctx.fillText(`${i}λ`, xLeft, cy + 18);
  }
}

  }

  drawPoint(ctx, pt) {
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 6, 0, Math.PI*2); ctx.fill();
		
  }

  drawCircularWaves(ctx, cx, cy) {
    // Rien tant que le temps n'a pas bougé
    if (!this.isRunning && this.time === 0) return;
    const pxPerCm = 2;
    const maxR = Math.hypot(cx, cy) * 1.2;
    const currentFront = this.velocityVisual * this.time * pxPerCm;
    const limit = Math.min(maxR, currentFront);

    for (let r = 0; r <= limit; r += 2) {
      const rc = r / pxPerCm; // cm
      const travelT = rc / this.velocityVisual; // s
      const phase = 2 * Math.PI * this.frequency * (this.time - travelT) + (this.startDirection === "up" ? 0 : Math.PI);
      const A = this.amplitude * Math.sin(phase);
      const intensity = (A / this.amplitude + 1) / 2; // 0..1
      const b = Math.floor(120 + 135 * intensity);
      const gr = Math.floor(160 + 50 * intensity);
      const rd = Math.floor(100 + 20 * (1 - intensity));
      ctx.strokeStyle = `rgba(${rd},${gr},${b},0.6)`;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    }
	
  }
  drawGraduations(ctx, centerX, centerY) {
        const pixelsPerCm = 20; // Même échelle que la coupe transversale
        const wavelengthPixels = this.wavelengthDisplay * pixelsPerCm;
        
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 1;
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        
        // Dessiner les graduations de longueur d'onde
       
    }

  // =============================
  // Diagramme temporel
  // =============================
  drawDiagram() {
	  
    const ctx = this.diagramCtx, W = this.diagramCanvas.width, H = this.diagramCanvas.height;
    ctx.clearRect(0,0,W,H);

    const m = { left: 48, right: 12, top: 10, bottom: 28 };
    const plotW = W - m.left - m.right;
    const plotH = H - m.top - m.bottom;

    // fond
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,W,H);

    const Amax = Math.max(5, this.amplitude);
    const y0 = m.top + plotH/2;

    // quadrillage horizontal (mm)
    ctx.strokeStyle = "#e0e0e0"; ctx.font = "10px Arial"; ctx.fillStyle = "#2c3e50"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    const mmStep = (Amax <= 6) ? 1 : (Amax <= 12 ? 2 : 5);
    for (let v = -Math.ceil(Amax/mmStep)*mmStep; v <= Math.ceil(Amax/mmStep)*mmStep; v += mmStep) {
      const y = y0 - v * (plotH/(2*Amax));
      ctx.beginPath(); ctx.moveTo(m.left, y); ctx.lineTo(m.left+plotW, y); ctx.stroke();
      if (y > m.top+8 && y < m.top+plotH-8) ctx.fillText(`${v} mm`, m.left-4, y);
    }

    // axes
    ctx.strokeStyle = "#34495e";
    ctx.beginPath(); ctx.moveTo(m.left, y0); ctx.lineTo(m.left+plotW, y0); ctx.stroke(); // axe centrale
    ctx.beginPath(); ctx.moveTo(m.left, m.top); ctx.lineTo(m.left, m.top+plotH); ctx.stroke();

    // repères en T (4 périodes visibles)
    const periodsToShow = 4;
    const timeSpan = periodsToShow * this.period;
    const tEnd = this.time;
    const tStart = tEnd - timeSpan;

    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#2c3e50";
    for (let k = Math.ceil(tStart/this.period); k <= Math.floor(tEnd/this.period); k++) {
      const tk = k * this.period;
      const x = m.left + ((tk - tStart)/timeSpan) * plotW;
      ctx.strokeStyle = "#e0e0e0";
      ctx.beginPath(); ctx.moveTo(x, m.top); ctx.lineTo(x, m.top+plotH); ctx.stroke();
      if (x > m.left+10 && x < m.left+plotW-10) ctx.fillText(`${k}T`, x, m.top+plotH+4);
    }

    // Helpers de mapping
    const xFromT = (t) => m.left + ((t - tStart)/timeSpan) * plotW;
    const yFromMM = (mm) => y0 - (mm * (plotH/(2*Amax)));

    // ===== Traces selon cases cochées =====
	
    // Source
    if (this.showSourceTrace) {
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = "purple";
      let moved = false;
      for (let i = 0; i < this.sourceTimes.length; i++) {
        const t = this.sourceTimes[i]; if (t < tStart) continue;
        const amp = this.sourceDisp[i];
        const x = xFromT(t), y = yFromMM(amp);
        if (!moved) { ctx.moveTo(x,y); moved = true; } else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    const plotTrace = (pt) => {
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = pt.color;
      let moved = false;
      for (let i = 0; i < pt.times.length; i++) {
        const t = pt.times[i]; if (t < tStart) continue;
        const amp = pt.trace[i];
        const x = xFromT(t), y = yFromMM(amp);
        if (!moved) { ctx.moveTo(x,y); moved = true; } else ctx.lineTo(x,y);
      }
      ctx.stroke();
    };

    if (this.showATrace) plotTrace(this.pointA);
    if (this.showBTrace) plotTrace(this.pointB);
 const { coeffA, coeffB } = this.getRetards();
ctx.font = "14px Arial";
ctx.fillStyle = "red";
let thetaMajuscule = 'Θ';
ctx.fillText(`ΘA = ${coeffA} T`, 200, H - 12);  // proche de l’axe du temps
ctx.fillStyle = "green";
ctx.fillText(`ΘB = ${coeffB} T`,300, H - 12);

    // Légende (uniquement les courbes visibles)
    ctx.font = "12px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    let lx = W - 120, ly = 18, lh = 18;
    if (this.showSourceTrace) { ctx.fillStyle = "purple"; ctx.fillRect(lx, ly, 15, 3); ctx.fillStyle = "#000"; ctx.fillText("Source", lx+22, ly); ly += lh; }
    if (this.showATrace)     { ctx.fillStyle = "red";    ctx.fillRect(lx, ly, 15, 3); ctx.fillStyle = "#000"; ctx.fillText("Point A", lx+22, ly); ly += lh; }
    if (this.showBTrace)     { ctx.fillStyle = "green";  ctx.fillRect(lx, ly, 15, 3); ctx.fillStyle = "#000"; ctx.fillText("Point B", lx+22, ly); }

    // Labels des axes
    ctx.save();
    ctx.font = "11px Arial";
    ctx.textAlign = "left"; ctx.fillText("temps (T)", m.left+5, H-4);
    ctx.translate(12, m.top + plotH/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign = "center"; ctx.fillText("déplacement (mm)", 0, 0);
    ctx.restore();
	
	
	
  }
  
 
getRetards() {
		
  
  const cx = this.mainCanvas.width / 2;
  const cy = this.mainCanvas.height / 2;
 const pxPerCm = 200;

  const distanceCmA = Math.hypot(this.pointA.x - cx, this.pointA.y - cy) / pxPerCm;
  const distanceCmB = Math.hypot(this.pointB.x - cx, this.pointB.y - cy) / pxPerCm;

  const tauA = distanceCmA / this.velocity; // retard en secondes
  const tauB = distanceCmB / this.velocity;

  const coeffA = (tauA / this.period).toFixed(2);
  const coeffB = (tauB / this.period).toFixed(2);

  return { tauA, tauB, coeffA, coeffB };
}

}


// -----------------------
// Boot
// -----------------------
let simulation;
document.addEventListener("DOMContentLoaded", () => {
  simulation = new WaveSimulation();
});
