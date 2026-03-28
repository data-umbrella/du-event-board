import { useState } from "react";
import events from "../data/events.json";

export function useParticipation() {
    const [joinedEventIds, setJoinedEventIds] = useState(() => {
        try {
            const saved = localStorage.getItem("joinedEvents");
            return saved && saved !== "undefined" ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const joinEvent = (eventId) => {
        setJoinedEventIds(prev => {
            console.log("adding to previous joined events:", prev, "eventId to add:", eventId);
            if (prev.includes(eventId)) return prev;
            const updated = [...prev, eventId];
            localStorage.setItem("joinedEvents", JSON.stringify(updated));
            return updated;
        });
    };

    const cancelEvent = (eventId) => {
        setJoinedEventIds(prev => {
            console.log("removing from previous joined events:", prev, "eventId to remove:", eventId);
            const updated = prev.filter(id => id !== eventId);
            localStorage.setItem("joinedEvents", JSON.stringify(updated));
            return updated;
        });
    };

    const isJoined = (eventId) => joinedEventIds.includes(eventId);

    const joinedEvents = events.filter(e => joinedEventIds.includes(e.id));

    return { joinedEvents, joinEvent, cancelEvent, isJoined };
}