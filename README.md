# 🦷 KDIP (Kawalan Inventori Pergigian) System

> A modern, real-time logistics and supply chain management platform built for District Dental Clinics under the Ministry of Health (MOH) Malaysia.

KDIP transforms traditional manual tracking and spreadsheet-based inventory methods into a lightning-fast, highly secure, and automated digital ecosystem. It is designed to provide District Health Offices with crystal-clear visibility over their medical supplies, prevent critical stockouts, and streamline daily clinic operations.

---

## ✨ Key Features

### 📱 Peer-to-Peer QR Transfers
Clinics can borrow or transfer stock to one another seamlessly. The sending clinic generates a secure **QR Code**, and the receiving clinic simply scans it with their mobile device to instantly update both inventory balances. 

### 📄 Smart PDF Parsing (KEW.PS-8)
No more manual data entry for bulk deliveries. Store managers can upload official KEW.PS-8 PDF delivery receipts, and the system's geometric parser will automatically extract the 13-digit SPPA item codes and quantities, updating the warehouse stock in seconds.

### 📊 Real-Time Analytics & AI Insights
The Admin Dashboard features a comprehensive Recharts-powered analytics engine. It tracks consumption patterns, identifies high-burn-rate items, monitors inter-clinic borrowing, and generates plain-language **Executive Summaries** automatically based on live database metrics.

### 🚨 "Andon" Low-Stock Alerts
A visual pulse-alert system constantly monitors clinic inventories against District minimum-stock thresholds. If critical supplies (like gloves or anesthetics) drop too low, the system immediately flags the district managers to initiate replenishment.

---

## 🏗️ System Architecture & Tech Stack

KDIP is built for extreme performance and strict security, running entirely within an isolated Dockerized environment.

* **Frontend Engine:** React, Tailwind CSS, Recharts (for analytics).
* **Backend Runtime:** [Bun](https://bun.sh/) + Express.js (Ultra-fast JavaScript runtime).
* **Database:** PostgreSQL (Relational integrity for complex audit trails).
* **Security:** Helmet.js (HTTP Header protection), bcrypt (cost: 10) password hashing, strict CORS policies, and Role-Based Access Control (RBAC).
* **Containerization:** Multi-stage Docker Builds ensuring identical behavior across development (Sandbox) and Production servers.

---

## 👥 User Roles & Access Control

The system is strictly divided into three operational roles to ensure data integrity:

1. **Admin (Pejabat Kesihatan Daerah):** Full access to user management, the Master Items Catalog (SPPA standardization), and district-wide analytics.
2. **Warehouse (Stor Utama):** Monitors district-wide shortages, handles bulk PDF stock intake, and dispatches stock to satellite clinics.
3. **Clinic (Klinik Pergigian):** Mobile-first interface for daily usage logging, receiving stock, and initiating QR stock transfers.

---

## 🛡️ Security & Compliance

* **JKN Compliant Passwords:** Enforced 8+ character password policies using advanced bcrypt cryptographic hashing.
* **Stateless Authentication:** JWT-based session management.
* **Network Hardening:** Helmet-injected HTTP headers prevent XSS, Clickjacking, and MIME-sniffing attacks.
* **Immutable Audit Trails:** Every single stock movement (Deduct, Add, Transfer) generates a unique `TXN-` timestamped receipt mapped to specific users and locations.

---

## 🚀 Getting Started (Development)

To spin up the KDIP engine on a local machine or VPS:

1. Clone the repository.
2. Configure your `.env` file with your Postgres credentials and `APP_MODE` (production/sandbox).
3. Build and launch the container:
   
   docker compose up -d --build

// Built to empower frontline healthcare workers by making logistics invisible, accurate, and fast. //