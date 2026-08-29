# 📚 Catálogo Virtual — Copy Camacho

Catálogo interactivo de venta y exhibición de útiles escolares y artículos de papelería para **Copy Camacho** (Cali, Colombia). Diseñado para optimizar la atención de pedidos y eliminar la fricción de consultas manuales de inventario por chat.

---

## ✨ Características Principales

* **Exploración por Categorías:** Navegación fluida entre útiles de escritura, cuadernos, geometría, arte, papelería y accesorios.
* **Búsqueda & Filtros en Tiempo Real:** Búsqueda instantánea por nombre o descripción y ordenamiento por precio y destacados.
* **Carrito de Compras Local:** Gestión de ítems con persistencia en `localStorage`.
* **Checkout Directo a WhatsApp:** Generación automática de mensaje estructurado con el desglose de productos, cantidades, total en COP y datos del cliente (modalidad en tienda o domicilio).
* **Integración con Supabase:** Backend serverless en PostgreSQL con Row Level Security (RLS) para lectura pública y gestión ágil de catálogo.
* **Diseño Mobile-First:** Interfaz moderna y responsiva construida con Tailwind CSS v4.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19 + TypeScript + Vite
* **Estilos:** Tailwind CSS v4
* **Base de Datos & Auth:** Supabase (PostgreSQL)
* **Iconos:** Lucide React

---

## 🚀 Instalación y Puesta en Marcha

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/david206614/Catalogo-copy-camacho.git
   cd Catalogo-copy-camacho
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env.local` basado en `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://avdkbpgookwbsrmddlhj.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_publica_de_supabase
   VITE_WHATSAPP_PHONE=573173312352
   VITE_STORE_NAME="Copy Camacho"
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📄 Documentación Académica
Este proyecto cuenta con su especificación formal de requerimientos (SRS), análisis 5W2H y diagramas de arquitectura documentados en **Obsidian**.
