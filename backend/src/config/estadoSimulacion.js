let simulacionCorriendo = true;

module.exports = {
    estaActiva: () => simulacionCorriendo,
    detener: () => { simulacionCorriendo = false; },
    iniciar: () => { simulacionCorriendo = true; }
};