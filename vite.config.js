export default {
  server: {
    host: true,        // expose on LAN (0.0.0.0)
    port: 5173,        // force a stable port for the tunnel
    https: false,      // tunnel provides HTTPS externally
    // Allow Cloudflare quick tunnel hostnames
    allowedHosts: [
       'saved-sapphire-conviction-searching.trycloudflare.com'
    ]
  }
};
