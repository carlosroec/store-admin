# Manual de Usuario - Store Admin

Sistema de administración para gestión de productos, clientes, ventas y reportes.

---

## Tabla de Contenidos

1. [Inicio de Sesión](#inicio-de-sesión)
2. [Navegación](#navegación)
3. [Productos](#productos)
4. [Clientes](#clientes)
5. [Ventas](#ventas)
6. [Reportes](#reportes)

---

## Inicio de Sesión

### Acceso al Sistema
1. Ingresa a la URL del sistema
2. Introduce tu **email** y **contraseña**
3. Haz clic en **Login**

> Si la sesión expira, serás redirigido automáticamente a la página de login.

---

## Navegación

El menú principal se encuentra en la parte superior y contiene:

| Sección | Descripción |
|---------|-------------|
| Home | Dashboard principal |
| Products | Gestión de productos |
| Customers | Gestión de clientes |
| Sales | Gestión de ventas y cotizaciones |
| Reports | Reportes y estadísticas |

En dispositivos móviles, el menú se accede mediante el ícono de hamburguesa (☰).

---

## Productos

### Listado de Productos
- Muestra todos los productos con imagen, precio, stock y estado
- Los productos **deshabilitados** aparecen en gris con etiqueta "Disabled"
- Usa los filtros para buscar por categoría, marca o texto

### Crear Producto
1. Clic en **+ Add Product**
2. Completa los campos:
   - **SKU**: Código único del producto (ej: PROD-001)
   - **Name**: Nombre del producto
   - **Brand**: Marca
   - **Category**: Categoría
   - **Price**: Precio con IGV incluido
   - **Stock**: Cantidad disponible
   - **On The Way**: Cantidad en camino (opcional)
   - **Description**: Descripción con formato Markdown
3. **Imágenes**: Arrastra o selecciona hasta 5 imágenes
4. Clic en **Create Product**

### Formato Markdown en Descripción
```markdown
# Título
## Subtítulo
**texto en negrita**
*texto en cursiva*
- elemento de lista
- otro elemento
`código`
```

### Editar Producto
1. Clic en el producto del listado
2. Clic en **Edit**
3. Modifica los campos necesarios
4. Clic en **Update Product**

### Habilitar/Deshabilitar Producto
1. Abre el detalle del producto
2. Clic en **Disable** o **Enable**
- Los productos deshabilitados no aparecen en búsquedas de ventas

### Eliminar Producto
1. Abre el detalle del producto
2. Clic en **Delete**
3. Confirma la eliminación

---

## Clientes

### Listado de Clientes
- Muestra nombre, teléfono, email y fuente de captación
- Usa el buscador para filtrar por nombre o documento

### Crear Cliente
1. Clic en **+ Add Customer**
2. Campos obligatorios:
   - **Full Name**: Nombre completo
   - **Social Media Source**: De dónde proviene el cliente
3. Campos opcionales:
   - **Document Type/Number**: DNI, RUC, CE o Pasaporte
   - **Phone**: Teléfono (formato: 9XX XXX XXX)
   - **Email**: Correo electrónico
   - **Address**: Dirección completa
4. Clic en **Create Customer**

### Editar Cliente
1. Clic en el cliente del listado
2. Clic en **Edit**
3. Modifica los campos necesarios
4. Clic en **Update Customer**

---

## Ventas

### Flujo de Estados

```
QUOTE (Cotización)
    ↓ Convert to Pending
PENDING (Stock Reservado)
    ↓ Mark as Paid
PAID (Stock Descontado)
    ↓ Start Processing
PROCESSING (En preparación)
    ↓ Mark as Shipped
SHIPPED (Enviado)
    ↓ Mark as Delivered
DELIVERED (Entregado)
```

**Cancelaciones:**
- Quote → Cancelled: Sin impacto en stock
- Pending → Cancelled: Libera stock reservado
- Paid/Processing/Shipped → Cancelled: Restaura stock

### Crear Cotización (Quote)
1. Clic en **+ New Quote**
2. **Seleccionar Cliente**:
   - Busca por nombre
   - O crea uno nuevo con **+ Create Customer**
3. **Agregar Productos**:
   - Busca productos por nombre o SKU
   - Indica cantidad y descuento (%)
   - Clic en **Add**
4. **Opciones Adicionales**:
   - General Discount: Descuento total en monto
   - Shipping Cost: Costo de envío
   - Shipping Method: Pickup, Delivery, Olva, Shalom
   - Quote Valid Days: Días de validez
   - Notes: Notas visibles para el cliente
   - Internal Notes: Notas privadas
5. Clic en **Create Quote**

### Gestionar Venta
1. Abre el detalle de la venta
2. Acciones disponibles según estado:

| Estado | Acciones Disponibles |
|--------|---------------------|
| Quote | Edit, Convert to Pending, Cancel |
| Pending | Mark as Paid, Cancel |
| Paid | Start Processing, Add Products, Cancel |
| Processing | Mark as Shipped, Add Products, Cancel |
| Shipped | Mark as Delivered, Cancel |
| Delivered | - (Estado final) |

### Agregar Productos a Venta Pagada
Cuando un cliente quiere agregar productos después de pagar:
1. Abre la venta en estado **Paid** o **Processing**
2. Clic en **Add Products**
3. Agrega los productos adicionales
4. Se crea una **venta vinculada** al pedido original

### Ventas Vinculadas
- Las ventas vinculadas aparecen en la sección "Linked Sales"
- Cada venta vinculada tiene su propio número y estado
- Puedes ver la venta padre desde una venta vinculada

### Imprimir Cotización/Venta
1. Abre el detalle de la venta
2. Clic en **Print**
3. Se abre vista optimizada para impresión

---

## Reportes

### Reporte de Ventas

Accede desde **Reports → Sales Report**

#### Filtros
- **Start Date**: Fecha inicial del período
- **End Date**: Fecha final del período
- Por defecto muestra el mes actual

#### Métricas Principales
- **Total Revenue**: Ingresos totales
- **Orders**: Número de pedidos
- **Average Ticket**: Ticket promedio
- **IGV Collected**: IGV recaudado

#### Desglose de Ingresos
- Subtotal
- Descuentos aplicados
- Costos de envío
- IGV (incluido en precios)

#### Análisis Incluidos
- **Ventas por Estado**: Distribución de ventas según su estado
- **Por Método de Pago**: Cash, Card, Yape, Plin, Transfer
- **Por Método de Envío**: Pickup, Delivery, Olva, Shalom
- **Ventas Diarias**: Tendencia de ventas en el período
- **Top 10 Productos**: Productos más vendidos
- **Top 10 Clientes**: Mejores clientes por monto

---

## Gestión de Stock

### Tipos de Stock
- **Stock**: Cantidad física disponible
- **Reserved Stock**: Reservado por pedidos pendientes
- **On The Way**: En camino del proveedor
- **Available**: Stock - Reserved (disponible para venta)

### Comportamiento del Stock

| Transición | Efecto en Stock |
|------------|-----------------|
| Quote → Pending | Reserva stock |
| Pending → Paid | Confirma deducción |
| Pending → Cancelled | Libera reserva |
| Paid → Cancelled | Restaura stock |

---

## Información Fiscal

### IGV (Impuesto General a las Ventas)
- Todos los precios **incluyen IGV** (18%)
- El IGV se muestra como referencia en totales
- Fórmula: IGV = Total - (Total / 1.18)

---

## Tips y Mejores Prácticas

1. **Productos**
   - Usa SKUs descriptivos y únicos
   - Mantén el stock actualizado
   - Deshabilita productos discontinuados en lugar de eliminarlos

2. **Clientes**
   - Registra la fuente de captación para análisis
   - Completa el teléfono para contacto
   - Usa las notas internas para información relevante

3. **Ventas**
   - Convierte quotes a pending cuando el cliente confirma
   - Verifica el método de pago antes de marcar como pagado
   - Usa ventas vinculadas para productos adicionales

4. **Reportes**
   - Revisa los reportes semanalmente
   - Identifica productos top para mantener stock
   - Analiza métodos de pago preferidos

---

## Soporte

Para problemas técnicos o consultas, contacta al administrador del sistema.

---

*Última actualización: Enero 2026*
