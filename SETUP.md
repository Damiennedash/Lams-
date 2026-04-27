# LAMS Boutique – Guide d'installation

## Prérequis
- Node.js 18+
- MySQL (XAMPP, Laragon, ou MySQL natif)
- npm ou yarn

## Installation rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer la base de données
Ouvrez `.env.local` et modifiez `DATABASE_URL` avec vos identifiants MySQL :
```
DATABASE_URL="mysql://root:VOTRE_MOT_DE_PASSE@localhost:3306/lams"
```
> La base de données `lams` sera créée automatiquement.

### 3. Créer les tables
```bash
npm run db:push
```

### 4. Peupler avec des données de test
```bash
npm run db:seed
```
Cela crée :
- Compte admin : `admin@lams.com` / `admin123456` (ID: LMS-ADMIN001)
- 8 produits exemples
- 1 événement popup de démonstration

### 5. Lancer l'application
```bash
npm run dev
```
Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Structure des pages

| Page | URL |
|------|-----|
| Boutique | `/` |
| Connexion | `/login` |
| Inscription | `/register` |
| Détail produit | `/products/[id]` |
| Panier | `/cart` |
| Commandes | `/orders` |
| Favoris | `/wishlist` |
| Profil | `/profile` |
| **Admin** | `/admin` |
| Admin Produits | `/admin/products` |
| Admin Commandes | `/admin/orders` |
| Admin Événements | `/admin/events` |

---

## Configuration email (optionnel)
Pour l'envoi d'emails (ID unique, confirmation commande), configurez SMTP dans `.env.local` :
```
SMTP_USER=votre@gmail.com
SMTP_PASS=votre-app-password-google
```
> Sans configuration email, les IDs s'affichent à l'écran lors de l'inscription.

## Paiement Moov & Yas (production)
Ajoutez vos clés API dans `.env.local` :
```
MOOV_API_URL=...
MOOV_API_KEY=...
YAS_API_URL=...
YAS_API_KEY=...
```
> Sans clés, le système simule les paiements pour le développement.

---

## Credentials admin par défaut
- Email : `admin@lams.com`
- Mot de passe : `admin123456`
- ID : `LMS-ADMIN001`

⚠️ **Changez le mot de passe admin en production !**
