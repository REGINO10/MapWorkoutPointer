'use strict';

const form = document.querySelector('.form');
const workoutTypeField = document.querySelector('.form__input--type');
const elevationField = document.querySelector('.form__input--elevation');
const cadenceField = document.querySelector('.form__input--cadence');
const distanceField = document.querySelector('.form__input--distance');
const durationField = document.querySelector('.form__input--duration');
const workoutList = document.querySelector('.workouts');

class Workout {
  date = new Date();

  constructor(position, distance, duration) {
    this.position = position;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  constructor(position, distance, duration, cadence) {
    super(position, distance, duration);
    this.cadence = cadence;
  }

  calcPace() {
    return this.duration / this.distance;
  }
}

class Cycling extends Workout {
  constructor(position, distance, duration, elevation) {
    super(position, distance, duration);
    this.elevation = elevation;
  }

  calcSpeed() {
    return this.distance / (this.duration / 60);
  }
}

class App {
  #currentCoord;
  #currentMap;

  #workoutType;
  #clickPosition;
  #clickCoord;
  #newWorkout;

  #workouts = [];

  constructor() {
    this._getGeoLocation();

    workoutTypeField.addEventListener('change', this._switchWorkout.bind(this));

    form.addEventListener('submit', this._formSubmit.bind(this));

    workoutList.addEventListener('click', this._zoom.bind(this));
  }

  _getGeoLocation() {
    navigator.geolocation.getCurrentPosition(
      this._geoLocationPresent.bind(this),
      function () {
        alert('Could not get your position');
      }
    );
  }

  _geoLocationPresent(position) {
    const { latitude, longitude } = position.coords;

    this.#currentCoord = [latitude, longitude];

    this.#currentMap = L.map('map').setView(this.#currentCoord, 13);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#currentMap);

    this.#currentMap.on('click', this._openForm.bind(this));
  }

  _openForm(clickPosition) {
    form.classList.remove('hidden');
    distanceField.focus();
    this.#clickPosition = clickPosition;
    this.#workoutType = workoutTypeField.value;
  }

  _switchWorkout() {
    elevationField.closest('.form__row').classList.toggle('form__row--hidden');
    cadenceField.closest('.form__row').classList.toggle('form__row--hidden');
    this.#workoutType = workoutTypeField.value;
  }

  _formSubmit(e) {
    e.preventDefault();
    const alertMsg = 'All values should be positive numbers';

    const distance = Number(distanceField.value);
    const duration = Number(durationField.value);

    const { lat, lng } = this.#clickPosition.latlng;

    this.#clickCoord = [lat, lng];

    if (this.#workoutType === 'running') {
      const cadence = Number(cadenceField.value);
      if (
        this._numberCheck(distance, duration, cadence) &&
        this._positiveCheck(distance, duration, cadence)
      ) {
        this.#newWorkout = new Running(
          this.#clickCoord,
          distance,
          duration,
          cadence
        );
        this.#newWorkout.id = (Date.now() + '').slice(-10);
        this.#workouts.push(this.#newWorkout);
      } else alert(alertMsg);
    }

    if (this.#workoutType === 'cycling') {
      const elevation = Number(elevationField.value);
      if (
        this._numberCheck(distance, duration, elevation) &&
        this._positiveCheck(distance, duration)
      ) {
        this.#newWorkout = new Cycling(
          this.#clickCoord,
          distance,
          duration,
          elevation
        );
        this.#newWorkout.id = (Date.now() + '').slice(-10);
        this.#workouts.push(this.#newWorkout);
      } else alert(alertMsg);
    }

    distanceField.value =
      durationField.value =
      cadenceField.value =
      elevationField.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);

    this._createMarker();

    this._addWorkoutList();

    this.#workoutType = '';
    this.#clickPosition = {};
    this.#clickCoord = [];
    this.#newWorkout = {};
  }

  _createMarker() {
    L.marker(this.#clickCoord)
      .addTo(this.#currentMap)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${this.#workoutType}-popup`,
        })
      )
      .setPopupContent(`${this._setDescription(this.#newWorkout.date)}`)
      .openPopup();
  }

  _addWorkoutList() {
    let html = `<li class="workout workout--${this.#workoutType}" data-id="${
      this.#newWorkout.id
    }">
    <h2 class="workout__title">${this._setDescription(
      this.#newWorkout.date
    )}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        this.#workoutType === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${this.#newWorkout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${this.#newWorkout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (this.#workoutType === 'running') {
      html =
        html +
        `
      <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">>${this.#newWorkout
                  .calcPace()
                  .toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${this.#newWorkout.cadence}</span>
                <span class="workout__unit">spm</span>
              </div>
            </li>
      `;
    }

    if (this.#workoutType === 'cycling') {
      html =
        html +
        `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${this.#newWorkout
              .calcSpeed()
              .toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${this.#newWorkout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _setDescription(date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return `${this.#workoutType} on ${
      months[date.getMonth()]
    } ${date.getDate()}`;
  }

  _zoom(e) {
    if (e.target.closest('.workout')) {
      const element = e.target.closest('.workout');

      const zoomWorkout = this.#workouts.find(
        workout => workout.id === element.dataset.id
      );

      this.#currentMap.setView(zoomWorkout.position, 13, {
        animate: true,
        pin: {
          duration: 1,
        },
      });
    }
  }

  _numberCheck(...values) {
    return values.every(value => typeof value === 'number');
  }

  _positiveCheck(...values) {
    return values.every(value => value > 0);
  }
}

const app = new App();
