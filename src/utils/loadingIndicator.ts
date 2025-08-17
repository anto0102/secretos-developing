import NProgress from 'nprogress';
import 'nprogress/nprogress.css'; // Importa gli stili base

NProgress.configure({
  showSpinner: false, // Disabilita l'icona di caricamento rotonda
  trickleSpeed: 200,  // Velocità dell'animazione
});

export default NProgress;