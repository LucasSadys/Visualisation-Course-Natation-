document.addEventListener("DOMContentLoaded", function () {
    const poolSizeSelect = document.getElementById("pool-size");
    const raceDistanceInput = document.getElementById("race-distance");
    const swimmerTimesTbody = document.getElementById("swimmer-times");
    const pool = document.getElementById("pool");
    const swimmerCountInput = document.getElementById("swimmer-count");
    const startRaceButton = document.getElementById("start-race");
    const resetRaceButton = document.getElementById("reset-race");
    const timeDisplay = document.getElementById("time-display");
  
    let raceInProgress = false;
    let startTime;
    let raceInterval;
    let timerInterval;
  
    // Écoute les changements de la distance et du nombre de nageurs
    swimmerCountInput.addEventListener("change", generateSwimmerInputs);
    poolSizeSelect.addEventListener("change", generateSwimmerInputs);
    raceDistanceInput.addEventListener("change", generateSwimmerInputs);
    generateSwimmerInputs(); // Appeler pour générer initialement une ligne
  
    // Créer les lignes de nage dans la piscine
    for (let i = 1; i <= 8; i++) {
      let lane = document.createElement("div");
      lane.classList.add("lane");
      pool.appendChild(lane);
    }
  
    // Démarrer la course
    startRaceButton.addEventListener("click", startRace);
    // Réinitialiser la course
    resetRaceButton.addEventListener("click", resetRace);
  
    function generateSwimmerInputs() {
      swimmerTimesTbody.innerHTML = ''; // Réinitialiser les inputs
      const swimmerCount = parseInt(swimmerCountInput.value);
      const poolSize = parseInt(poolSizeSelect.value);
      const raceDistance = parseInt(raceDistanceInput.value);
      const numberOfPassages = Math.floor(raceDistance / poolSize);
  
      for (let i = 1; i <= swimmerCount; i++) {
        let row = document.createElement("tr");
        let passagesInput = '';
  
        // Générer les temps de passage pour chaque longueur
        for (let j = 1; j <= numberOfPassages; j++) {
          passagesInput += `
            <div>Passage ${j}: 
              <input type="number" class="passage-minutes" data-passage="${j}" data-swimmer="${i}" value="0" min="0" step="1" style="width:50px;">
              <input type="number" class="passage-seconds" data-passage="${j}" data-swimmer="${i}" value="0" min="0" max="59" step="1" style="width:50px;">
              <input type="number" class="passage-centiseconds" data-passage="${j}" data-swimmer="${i}" value="0" min="0" max="99" step="1" style="width:50px;">
            </div>`;
        }
  
        row.innerHTML = `
          <td>Nageur ${i}</td>
          <td><input type="text" class="name" data-swimmer="${i}" value="Nageur ${i}" style="width:100px;"></td>
          <td><input type="number" class="minutes" data-swimmer="${i}" value="0" min="0" step="1"></td>
          <td><input type="number" class="seconds" data-swimmer="${i}" value="0" min="0" max="59" step="1"></td>
          <td><input type="number" class="centiseconds" data-swimmer="${i}" value="0" min="0" max="99" step="1"></td>
          <td>${passagesInput}</td>
        `;
        swimmerTimesTbody.appendChild(row);
      }
    }
  
    function startRace() {
      if (raceInProgress) return; // Empêcher de redémarrer une course déjà en cours
  
      const poolSize = parseInt(poolSizeSelect.value); // 25m ou 50m
      const raceDistance = parseInt(raceDistanceInput.value); // ex: 100m, 200m
      const minutesInputs = document.querySelectorAll(".minutes");
      const secondsInputs = document.querySelectorAll(".seconds");
      const centisecondsInputs = document.querySelectorAll(".centiseconds");
  
      const laneElements = document.querySelectorAll(".lane");
      let swimmerTimes = [];
  
      // Réinitialiser le bassin en retirant les nageurs existants
      laneElements.forEach(lane => lane.innerHTML = '');
  
      // Pour chaque nageur, calculer le temps total et initialiser les positions
      minutesInputs.forEach((input, index) => {
        const minutes = parseFloat(minutesInputs[index].value);
        const seconds = parseFloat(secondsInputs[index].value);
        const centiseconds = parseFloat(centisecondsInputs[index].value);
        const totalTime = minutes * 60 + seconds + centiseconds / 100;
  
        if (totalTime > 0) {
          swimmerTimes.push({
            laneIndex: index,
            totalTime: totalTime,
            swimmerElement: createSwimmerElement(index)
          });
        }
      });
  
      if (swimmerTimes.length === 0) return; // Ne rien faire s'il n'y a pas de nageurs
  
      raceInProgress = true;
      startTime = Date.now();
  
      // Cacher le bouton de départ et afficher le bouton de réinitialisation
      startRaceButton.style.display = 'none';
      resetRaceButton.style.display = 'inline';
  
      // Démarrer la mise à jour des nageurs toutes les 100ms
      raceInterval = setInterval(() => updateSwimmers(swimmerTimes, raceDistance, poolSize), 100);
  
      // Démarrer le chronomètre visuel
      timerInterval = setInterval(updateTimer, 100);
    }
  
    function createSwimmerElement(laneIndex) {
      let swimmer = document.createElement("div");
      swimmer.classList.add("swimmer");
  
      const laneElements = document.querySelectorAll(".lane");
      laneElements[laneIndex].appendChild(swimmer);
  
      return swimmer;
    }
  
    function updateSwimmers(swimmerTimes, raceDistance, poolSize) {
      const currentTime = (Date.now() - startTime) / 1000; // Temps écoulé en secondes
      const laneWidth = pool.clientWidth; // Largeur du bassin
      const poolDistance = poolSize; // Taille d'un aller dans le bassin
  
      swimmerTimes.forEach(swimmer => {
        const { laneIndex, totalTime, swimmerElement } = swimmer;
        let progress = Math.min(currentTime / totalTime, 1); // Calculer le pourcentage de la course (entre 0 et 1)
  
        // Calculer la distance parcourue
        let distance = progress * raceDistance; // Distance parcourue totale en fonction du temps écoulé
  
        // Calculer combien d'allers-retours le nageur a fait dans le bassin
        let completeLaps = Math.floor(distance / poolDistance); // Nombre d'allers complets
        let remainingDistance = distance % poolDistance; // Distance restante pour l'aller actuel
  
        // Si le nageur est en train de revenir (nombre d'allers complets impair), inverser la direction
        if (completeLaps % 2 === 1) {
          remainingDistance = poolDistance - remainingDistance;
        }
  
        // Calculer la position en fonction de la distance restante
        let swimmerPosition = (remainingDistance / poolDistance) * laneWidth;
        swimmerElement.style.left = `${swimmerPosition}px`;
  
        // Terminer la course pour le nageur si le temps est atteint
        if (currentTime >= totalTime) {
          swimmerElement.style.left = `${laneWidth}px`; // Position finale
        }
      });
  
      // Si tous les nageurs ont terminé, arrêter la course
      if (swimmerTimes.every(swimmer => currentTime >= swimmer.totalTime)) {
        clearInterval(raceInterval);
        clearInterval(timerInterval);
        raceInProgress = false;
      }
    }
  
    function updateTimer() {
      const elapsedTime = (Date.now() - startTime) / 1000;
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = Math.floor(elapsedTime % 60);
      const centiseconds = Math.floor((elapsedTime * 100) % 100);
  
      timeDisplay.textContent = `${pad(minutes)}:${pad(seconds)}:${pad(centiseconds)}`;
    }
  
    function pad(number) {
      return number.toString().padStart(2, '0');
    }
  
    function resetRace() {
      clearInterval(raceInterval);
      clearInterval(timerInterval);
      raceInProgress = false;
      timeDisplay.textContent = "00:00:00";
  
      // Réinitialiser l'interface utilisateur
      const laneElements = document.querySelectorAll(".lane");
      laneElements.forEach(lane => lane.innerHTML = '');
  
      startRaceButton.style.display = 'inline';
      resetRaceButton.style.display = 'none';
    }
  });
  