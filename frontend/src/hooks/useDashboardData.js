import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { authHeader, endpointForRole } from "../utils/dashboardHelpers";

export function useDashboardData(user) {
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const navRef = useRef(null);
  const dateRef = useRef(null);
  const greetRef = useRef(null);
  const subtitleRef = useRef(null);
  const kpisRef = useRef(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const endpoint = endpointForRole(user.role);
    if (!endpoint) {
      setError("No dashboard available for your role.");
      setReady(true);
      return;
    }
    fetch(endpoint, { headers: authHeader() })
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(live => { setData(live); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setReady(true));
  }, [user]);

  useEffect(() => {
    if (!ready || !data || animatedRef.current) return;
    animatedRef.current = true;
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(navRef.current, { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
      .fromTo(dateRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
      .fromTo(greetRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3")
      .fromTo(subtitleRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, "-=0.3")
      .fromTo(kpisRef.current?.children ?? [],
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 }, "-=0.2");
  }, [ready, data]);

  const retry = () => { setReady(false); setError(null); };

  return { data, ready, error, retry, refs: { navRef, dateRef, greetRef, subtitleRef, kpisRef } };
}