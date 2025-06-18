// DOM Elements
const container = document.querySelector('.container');
const resultado = document.querySelector('#resultado');
const formulario = document.querySelector('#formulario');
const historyList = document.querySelector('#history-list');
const suggestions = document.querySelector('#suggestions');

// State
let searchHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

// Initialize
window.addEventListener('load', () => {
    formulario.addEventListener('submit', buscarClima);
    loadHistory();
    setupCityInput();
});

// Search History Management
function addToHistory(city, country) {
    const search = { city, country, timestamp: Date.now() };
    searchHistory = [search, ...searchHistory.slice(0, 4)];
    localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
    loadHistory();
}

function loadHistory() {
    historyList.innerHTML = searchHistory.map(item => `
        <button class="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-left transition-colors flex justify-between items-center">
            <span>${item.city}, ${item.country}</span>
            <i class="fas fa-chevron-right"></i>
        </button>
    `).join('');

    historyList.querySelectorAll('button').forEach((button, index) => {
        button.addEventListener('click', () => {
            const { city, country } = searchHistory[index];
            document.querySelector('#ciudad').value = city;
            document.querySelector('#pais').value = country;
            buscarClima(new Event('submit'));
        });
    });
}

// City Input Autocomplete
function setupCityInput() {
    const cityInput = document.querySelector('#ciudad');
    let timeoutId;

    cityInput.addEventListener('input', (e) => {
        clearTimeout(timeoutId);
        const value = e.target.value.trim();
        
        if (value.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }

        timeoutId = setTimeout(() => {
            const matches = searchHistory
                .filter(item => item.city.toLowerCase().includes(value.toLowerCase()))
                .slice(0, 5);

            if (matches.length > 0) {
                suggestions.innerHTML = matches.map(item => `
                    <button class="w-full p-2 text-white hover:bg-white/20 text-left">
                        ${item.city}, ${item.country}
                    </button>
                `).join('');

                suggestions.classList.remove('hidden');
                
                suggestions.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', () => {
                        const [city, country] = button.textContent.split(', ');
                        document.querySelector('#ciudad').value = city;
                        document.querySelector('#pais').value = country;
                        suggestions.classList.add('hidden');
                    });
                });
            } else {
                suggestions.classList.add('hidden');
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!suggestions.contains(e.target) && e.target !== cityInput) {
            suggestions.classList.add('hidden');
        }
    });
}

function buscarClima(e) {
    e.preventDefault();
    const ciudad = document.querySelector('#ciudad').value.trim();
    const pais = document.querySelector('#pais').value;

    if(ciudad === '' || pais === '') {
        mostrarError('Both fields are required');
        return;
    }

    consultarAPI(ciudad, pais);
}

function mostrarError(mensaje) {
    const alerta = document.querySelector('.bg-red-100');
    if(!alerta) {
        const alerta = document.createElement('div');
        alerta.classList.add('bg-red-100', 'border-red-400', 'text-red-700', 'px-4', 'py-3', 'rounded', 'relative', 'max-w-md', 'mx-auto', 'mt-6', 'text-center');
        alerta.innerHTML = `
            <strong class="font-bold">Error!</strong>
            <span class="block sm:inline">${mensaje}</span>
        `;
        container.appendChild(alerta);
        setTimeout(() => {
            alerta.remove();
        }, 3000);
    }
}

function consultarAPI(ciudad, pais) {
    const appId = 'c3a9bfcf45970a35ee73dbb74816e254';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad},${pais}&appid=${appId}`;

    Spinner();

    fetch(url)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error('City not found');
            }
            return respuesta.json();
        })
        .then(datos => {
            limpiarHTML();
            mostrarClima(datos);
            addToHistory(ciudad, pais);
        })
        .catch(error => {
            limpiarHTML();
            mostrarError(error.message === 'City not found' ? 'City not found' : 'An error occurred');
        });
}

function mostrarClima(datos) {
    const { name, main: { temp, temp_max, temp_min, humidity }, weather, wind } = datos;
    const [weatherInfo] = weather;

    const grados = KelvinACentigrados(temp);
    const min = KelvinACentigrados(temp_min);
    const max = KelvinACentigrados(temp_max);

    const resultadoDiv = document.createElement('div');
    resultadoDiv.classList.add('text-center', 'text-white', 'space-y-4');

    resultadoDiv.innerHTML = `
        <div class="flex items-center justify-center gap-4">
            <i class="fas fa-${getWeatherIcon(weatherInfo.id)} text-6xl"></i>
            <div>
                <h2 class="text-3xl font-bold">${name}</h2>
                <p class="text-5xl font-bold mt-2">${grados}°C</p>
            </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mt-6">
            <div class="bg-white/10 p-4 rounded-lg">
                <i class="fas fa-temperature-high text-xl"></i>
                <p class="text-xl mt-2">${max}°C</p>
                <p class="text-sm opacity-75">High</p>
            </div>
            <div class="bg-white/10 p-4 rounded-lg">
                <i class="fas fa-temperature-low text-xl"></i>
                <p class="text-xl mt-2">${min}°C</p>
                <p class="text-sm opacity-75">Low</p>
            </div>
            <div class="bg-white/10 p-4 rounded-lg">
                <i class="fas fa-wind text-xl"></i>
                <p class="text-xl mt-2">${wind.speed} m/s</p>
                <p class="text-sm opacity-75">Wind</p>
            </div>
            <div class="bg-white/10 p-4 rounded-lg">
                <i class="fas fa-tint text-xl"></i>
                <p class="text-xl mt-2">${humidity}%</p>
                <p class="text-sm opacity-75">Humidity</p>
            </div>
        </div>
    `;

    resultado.appendChild(resultadoDiv);
}

function getWeatherIcon(code) {
    if (code >= 200 && code < 300) return 'bolt';
    if (code >= 300 && code < 400) return 'cloud-rain';
    if (code >= 500 && code < 600) return 'cloud-showers-heavy';
    if (code >= 600 && code < 700) return 'snowflake';
    if (code >= 700 && code < 800) return 'smog';
    if (code === 800) return 'sun';
    if (code > 800) return 'cloud';
    return 'cloud';
}

function KelvinACentigrados(grados) {
    return Math.round(grados - 273.15);
}

function limpiarHTML() {
    while(resultado.firstChild) {
        resultado.removeChild(resultado.firstChild);
    }
}

function Spinner() {
    limpiarHTML();
    const divSpinner = document.createElement('div');
    divSpinner.classList.add('sk-fading-circle');
    divSpinner.innerHTML = `
        <div class="sk-circle1 sk-circle"></div>
        <div class="sk-circle2 sk-circle"></div>
        <div class="sk-circle3 sk-circle"></div>
        <div class="sk-circle4 sk-circle"></div>
        <div class="sk-circle5 sk-circle"></div>
        <div class="sk-circle6 sk-circle"></div>
        <div class="sk-circle7 sk-circle"></div>
        <div class="sk-circle8 sk-circle"></div>
        <div class="sk-circle9 sk-circle"></div>
        <div class="sk-circle10 sk-circle"></div>
        <div class="sk-circle11 sk-circle"></div>
        <div class="sk-circle12 sk-circle"></div>
    `;
    resultado.appendChild(divSpinner);
}