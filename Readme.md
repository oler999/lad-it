# Projekt na studia

Projekt aplikacji śledzącej aktywność użytkownika.

## Jak uruchomić

Projekt znajduje się w katalogu `session-tracker`.

### Wariant lokalny

Wymagania: Node.js 20+ i npm.

1. Przejdź do katalogu projektu:
	```bash
	cd session-tracker
	```
2. Zainstaluj zależności:
	```bash
	npm install
	```
3. Uruchom aplikację w trybie deweloperskim:
	```bash
	npm run dev
	```

Frontend będzie dostępny na `http://localhost:4200`, a API na `http://localhost:3000`.

Jeśli chcesz uruchomić tylko jedną część projektu:

```bash
npm start   # frontend Angular
npm run api # backend Node.js
```

### Wariant Docker

Wymagania: Docker i Docker Compose.

1. Przejdź do katalogu projektu:
	```bash
	cd session-tracker
	```
2. Zbuduj i uruchom kontener:
	```bash
	docker compose up --build
	```

Po starcie aplikacja będzie dostępna na `http://localhost:3000`.

### Dodatkowe komendy

```bash
npm run build  # produkcyjny build Angulara
npm test       # testy
```
