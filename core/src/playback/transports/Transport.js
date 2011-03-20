(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var Transport = function Transport(options) {
        this.options = options;

        this.ready = new gli.util.EventSource("ready");

        this.events = {
            appendSessionInfo: new gli.util.EventSource("appendSessionInfo"),
            appendResource: new gli.util.EventSource("appendResource"),
            appendResourceUpdate: new gli.util.EventSource("appendResourceUpdate"),
            appendResourceDeletion: new gli.util.EventSource("appendResourceDeletion"),
            appendResourceVersion: new gli.util.EventSource("appendResourceVersion"),
            appendCaptureFrame: new gli.util.EventSource("appendCaptureFrame"),
            appendTimingFrame: new gli.util.EventSource("appendTimingFrame")
        };
    };
    
    transports.Transport = Transport;
    
})();