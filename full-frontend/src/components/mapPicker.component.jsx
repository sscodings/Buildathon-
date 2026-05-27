import { useEffect, useRef, useState } from "react";

const MapPicker = ({ onLocationSelect, initialPos = [20.5937, 78.9629] }) => {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const mapContainerRef = useRef(null);
    const [libLoaded, setLibLoaded] = useState(false);
    const [findingLocation, setFindingLocation] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (window.L) {
                setLibLoaded(true);
                clearInterval(interval);
            }
        }, 300);
        return () => clearInterval(interval);
    }, []);

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.address) {
                onLocationSelect({
                    lat, lng,
                    city: data.address.city || data.address.town || data.address.village || "",
                    state: data.address.state || "",
                    country: data.address.country || "",
                    display_name: data.display_name
                });
            }
        } catch (err) {
            console.error("Geocoding error", err);
            onLocationSelect({ lat, lng, display_name: "Selected Location" });
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        
        setFindingLocation(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            const latlng = { lat: latitude, lng: longitude };
            
            if (mapRef.current) {
                mapRef.current.setView(latlng, 13);
                if (markerRef.current) {
                    markerRef.current.setLatLng(latlng);
                } else {
                    markerRef.current = window.L.marker(latlng).addTo(mapRef.current);
                }
                reverseGeocode(latitude, longitude);
            }
            setFindingLocation(false);
        }, (err) => {
            alert("Could not get location: " + err.message);
            setFindingLocation(false);
        });
    };

    useEffect(() => {
        if (!libLoaded || !mapContainerRef.current) return;
        const L = window.L;

        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, { zoomControl: false }).setView(initialPos, 5);
            L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(mapRef.current);

            mapRef.current.on('click', (e) => {
                if (markerRef.current) {
                    markerRef.current.setLatLng(e.latlng);
                } else {
                    markerRef.current = L.marker(e.latlng).addTo(mapRef.current);
                }
                reverseGeocode(e.latlng.lat, e.latlng.lng);
            });
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
    }, [libLoaded]);

    return (
        <div className="h-72 w-full rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-sm relative z-0 group">
            {!libLoaded && (
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
                    <span className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></span>
                </div>
            )}
            <div ref={mapContainerRef} className="h-full w-full" />
            
            {/* Control Overlays */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                <button 
                    type="button"
                    onClick={handleCurrentLocation}
                    disabled={findingLocation}
                    className="bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs py-2 px-3 rounded-xl shadow-lg border border-emerald-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                    {findingLocation ? 
                        <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span> : 
                        <i className="fi fi-rr-crosshairs"></i>
                    }
                    {findingLocation ? "Finding..." : "Use Current Location"}
                </button>
            </div>

            <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none opacity-100 transition-opacity">
                <p className="bg-emerald-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[9px] font-bold shadow-xl flex items-center gap-2">
                    <i className="fi fi-rr-marker"></i> Tap anywhere or use GPS
                </p>
            </div>
        </div>
    );
};

export default MapPicker;
