import { COOKIE_EXPIRATION_DAYS } from "./constants";

type PersistedData = {
    visited: boolean;
    streak: number;
    mostRecent: string;
}

type CookieData = {
    [name: string]: any;
};

type CookieParser = {
    [name: string]: (value: string) => any
};

export class GameData {
    private date: Date;
    private data: PersistedData;
    private schema: CookieParser = {
        visited: (value) => value === 'true',
        streak: (value) => parseInt(value),
        mostRecent: (value) => value,
    };

    constructor(date: Date) {
        this.date = date;
        const cookieData = this.parseCookie();

        this.data = {
            visited: cookieData.visited ?? false,
            streak: cookieData.streak ?? 0,
            mostRecent: cookieData.mostRecent ?? '',
        };

        this.checkStreak();
    }

    setVisited() {
        this.data.visited = true;
        this.saveData();
    }

    hasVisited() {
        return this.data.visited;
    }

    checkStreak() {
        if (this.data.mostRecent === this.formatDate(this.date)) {
            return;
        }

        const dayBefore = new Date(this.date);
        dayBefore.setDate(this.date.getDate() - 1);

        if (this.data.mostRecent !== this.formatDate(dayBefore)) {
            this.data.streak = 0;
        }
    }

    addStreak() {
        if (this.data.mostRecent === this.formatDate(this.date)) {
            return;
        }

        this.data.streak++;
        this.data.mostRecent = this.formatDate(this.date);
        this.saveData();
    }

    saveData() {
        const cookieExpirationDate = new Date();
        cookieExpirationDate.setDate(new Date().getDate() + COOKIE_EXPIRATION_DAYS);
        const expirationString = 'expires=' + cookieExpirationDate.toUTCString();
        Object.entries(this.data).forEach(([name, value]) => {
            document.cookie = name + '=' + value.toString() + ';' + expirationString;
        });
    }

    parseCookie(): CookieData {
        const data: CookieData = {};
        if (document.cookie) {
            decodeURI(document.cookie)
                .split(';')
                .map(entry => entry.split("="))
                .forEach(keyValue => {
                    const key = keyValue[0].trim();
                    const value = keyValue[1];
                    if (this.schema.hasOwnProperty(key)) {
                        data[key] = this.schema[key](value);
                    }
                });
        }
        return data;
    }

    formatDate(date: Date) {
        return [
            date.getFullYear().toString(),
            (date.getMonth() + 1).toString().padStart(2, '0'),
            date.getDate().toString().padStart(2, '0'),
        ].join('');
    }

    getDate() {
        return this.date;
    }

    getStreak() {
        return this.data.streak;
    }
}
