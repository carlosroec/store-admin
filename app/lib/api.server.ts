import { forceLogout } from './auth.server';

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    token: string;
    user: {
        id: string;
        email: string;
    };
}

export interface Product {
    _id: string;
    sku: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    offerPrice?: number;
    description?: string;
    stock: number;
    images: string[];
    isActive: boolean;
    isTopSales?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDTO {
    sku: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    description?: string;
    stock?: number;
    images?: string[];
    isActive?: boolean;
    isTopSales?: boolean;
}

export interface SaleItem {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
}

export interface ProductFilters {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    includeInactive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export interface Sale {
    _id: string;
    saleNumber: string;
    customerId: any;
    customerName: string;
    customerDocument: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    shippingCost: number;
    shippingMethod?: string;
    tax: number;
    total: number;
    status: 'quote' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
    paymentMethod?: string;
    quoteDate: string;
    quoteValidUntil?: string;
    paidDate?: string;
    deliveredDate?: string;
    notes?: string;
    internalNotes?: string;
    parentSaleId?: string;
    createdAt: string;
}

export interface CreateSaleDTO {
    customerId: string;
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice?: number;
        discount?: number;
    }>;
    discount?: number;
    shippingCost?: number;
    shippingMethod?: string;
    paymentMethod?: string;
    voucherType?: string;
    quoteValidDays?: number;
    notes?: string;
    internalNotes?: string;
}

export interface LinkedSaleData {
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice?: number;
        discount?: number;
    }>;
    discount?: number;
    shippingCost?: number;
    shippingMethod?: string;
    notes?: string;
    internalNotes?: string;
}

export interface CloudinarySignature {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryDTO {
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    order?: number;
}

export interface Brand {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBrandDTO {
    name: string;
    slug?: string;
    description?: string;
    logo?: string;
    order?: number;
}

// ==================== EXPENSES ====================

export type ExpenseType = 'operational' | 'inventory' | 'service' | 'other';
export type ExpenseDocumentType = 'receipt' | 'invoice' | 'none';
export type ExpensePaymentMethod = 'cash' | 'card' | 'transfer' | 'yape' | 'plin';

export interface Expense {
    _id: string;
    expenseNumber: string;
    type: ExpenseType;
    category: string;
    description: string;
    amount: number;
    quantity?: number;
    unitCost?: number;
    supplier?: string;
    documentType?: ExpenseDocumentType;
    documentNumber?: string;
    paymentMethod: ExpensePaymentMethod;
    expenseDate: string;
    notes?: string;
    productId?: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateExpenseDTO {
    type: ExpenseType;
    category: string;
    description: string;
    amount: number;
    quantity?: number;
    unitCost?: number;
    supplier?: string;
    documentType?: ExpenseDocumentType;
    documentNumber?: string;
    paymentMethod: ExpensePaymentMethod;
    expenseDate: string;
    notes?: string;
    productId?: string;
}

export interface ExpenseFilters {
    type?: ExpenseType;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    paymentMethod?: ExpensePaymentMethod;
    supplier?: string;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
}

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
    }

    // Private fetch wrapper that handles 401
    private async fetch(url: string, options?: RequestInit): Promise<Response> {
        const response = await fetch(url, options);

        if (response.status === 401) {
            await forceLogout();
        }

        return response;
    }

    // Get Cloudinary upload signature
    async getCloudinarySignature(token: string, folder: string = 'products'): Promise<CloudinarySignature> {
        const response = await this.fetch(`${this.baseUrl}/api/cloudinary/signature`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folder }),
        });

        if (!response.ok) {
            throw new Error('Failed to get upload signature');
        }

        const data = await response.json();
        return data;
    }

    // Delete image from Cloudinary
    async deleteCloudinaryImage(token: string, publicId: string): Promise<{ success: boolean }> {
        const response = await this.fetch(`${this.baseUrl}/api/cloudinary/delete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete image');
        }

        return response.json();
    }

    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        // Use native fetch for login - 401 here means invalid credentials, not expired session
        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    }

    async getProfile(token: string) {
        const response = await this.fetch(`${this.baseUrl}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        return response.json();
    }

    // Get all products
    async getProducts(token: string, filters?: ProductFilters) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${this.baseUrl}/api/products${params.toString() ? `?${params}` : ''}`;

        const response = await this.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        return response.json();
    }

    // Get product by ID
    async getProduct(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/products/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Product not found');
        }

        return response.json();
    }

    // Create product
    async createProduct(token: string, data: CreateProductDTO) {
        const response = await this.fetch(`${this.baseUrl}/api/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create product');
        }

        return response.json();
    }

    // Update product
    async updateProduct(token: string, id: string, data: Partial<CreateProductDTO>) {
        const response = await this.fetch(`${this.baseUrl}/api/products/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update product');
        }

        return response.json();
    }

    // Delete product
    async deleteProduct(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        return response.json();
    }

    // Get categories
    async getCategories(token: string) {
        const response = await this.fetch(`${this.baseUrl}/api/products/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        return response.json();
    }

    // Get brands
    async getBrands(token: string) {
        const response = await this.fetch(`${this.baseUrl}/api/products/brands`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch brands');
        }

        return response.json();
    }

    // Add refill to product
    async addProductRefill(token: string, productId: string, refillProductId: string) {
        const response = await this.fetch(`${this.baseUrl}/api/products/${productId}/refills`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refillProductId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add refill');
        }

        return response.json();
    }

    // Remove refill from product
    async removeProductRefill(token: string, productId: string, refillProductId: string) {
        const response = await this.fetch(`${this.baseUrl}/api/products/${productId}/refills/${refillProductId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove refill');
        }

        return response.json();
    }

    // Create customer
    async createCustomer(token: string, data: {
        fullName: string;
        socialMedia: {
            source: string;
            username?: string;
            profileUrl?: string;
            notes?: string;
        };
        documentType?: string;
        documentNumber?: string;
        phone?: string;
        email?: string;
        notes?: string;
        address?: {
            street: string;
            district?: string;
            province?: string;
            department?: string;
            postalCode?: string;
            reference?: string;
        };
    }) {
        const response = await this.fetch(`${this.baseUrl}/api/customers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create customer');
        }

        return response.json();
    }

    // Get all customers
    async getCustomers(token: string, filters?: any) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${this.baseUrl}/api/customers${params.toString() ? `?${params}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch customers');
        }

        return response.json();
    }

    // Get customer by ID
    async getCustomer(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/customers/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Customer not found');
        }

        return response.json();
    }

    // Update customer
    async updateCustomer(token: string, id: string, data: any) {
        const response = await this.fetch(`${this.baseUrl}/api/customers/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update customer');
        }

        return response.json();
    }

    // Delete customer (soft delete)
    async deleteCustomer(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/customers/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete customer');
        }

        return response.json();
    }

    // Get all sales
    async getSales(token: string, filters?: any) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${this.baseUrl}/api/sales${params.toString() ? `?${params}` : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch sales');
        }

        return response.json();
    }

    // Create sale/quote
    async createSale(token: string, data: CreateSaleDTO) {
        const response = await this.fetch(`${this.baseUrl}/api/sales`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create sale');
        }

        return response.json();
    }

    // Update sale (only quotes)
    async updateSale(token: string, id: string, data: CreateSaleDTO) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update sale');
        }

        return response.json();
    }

    // Get sale by ID
    async getSale(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Sale not found');
        }

        return response.json();
    }

    // Update sale status
    async updateSaleStatus(token: string, id: string, data: { status: string; notes?: string }) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update sale status');
        }

        return response.json();
    }

    // Convert quote to pending
    async convertQuoteToPending(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${id}/convert-to-pending`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to convert quote');
        }

        return response.json();
    }

    // Mark sale as paid
    async markSaleAsPaid(token: string, id: string, paymentMethod: string) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${id}/mark-as-paid`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentMethod }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to mark sale as paid');
        }

        return response.json();
    }

    // Create linked sale (add products to paid order)
    async createLinkedSale(token: string, parentSaleId: string, data: LinkedSaleData) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${parentSaleId}/linked`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create linked sale');
        }

        return response.json();
    }

    // Get linked sales for a parent sale
    async getLinkedSales(token: string, parentSaleId: string) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${parentSaleId}/linked`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch linked sales');
        }

        return response.json();
    }

    // Get sale with linked sales
    async getSaleWithLinked(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/sales/${id}/with-linked`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Sale not found');
        }

        return response.json();
    }

    // Get sales statistics/reports
    async getSalesStatistics(token: string, startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `${this.baseUrl}/api/sales/statistics${params.toString() ? `?${params}` : ''}`;

        const response = await this.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch statistics');
        }

        return response.json();
    }

    // ==================== CATEGORIES ====================

    // Get all categories
    async getCategoriesAdmin(token: string, includeInactive: boolean = false) {
        const params = includeInactive ? '?includeInactive=true' : '';
        const response = await this.fetch(`${this.baseUrl}/api/categories${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }

        return response.json();
    }

    // Get category by ID
    async getCategory(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/categories/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Category not found');
        }

        return response.json();
    }

    // Create category
    async createCategory(token: string, data: CreateCategoryDTO) {
        const response = await this.fetch(`${this.baseUrl}/api/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create category');
        }

        return response.json();
    }

    // Update category
    async updateCategory(token: string, id: string, data: Partial<CreateCategoryDTO & { isActive?: boolean }>) {
        const response = await this.fetch(`${this.baseUrl}/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update category');
        }

        return response.json();
    }

    // Delete category
    async deleteCategory(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete category');
        }

        return response.json();
    }

    // ==================== BRANDS ====================

    // Get all brands
    async getBrandsAdmin(token: string, includeInactive: boolean = false) {
        const params = includeInactive ? '?includeInactive=true' : '';
        const response = await this.fetch(`${this.baseUrl}/api/brands${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch brands');
        }

        return response.json();
    }

    // Get brand by ID
    async getBrand(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/brands/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Brand not found');
        }

        return response.json();
    }

    // Create brand
    async createBrand(token: string, data: CreateBrandDTO) {
        const response = await this.fetch(`${this.baseUrl}/api/brands`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create brand');
        }

        return response.json();
    }

    // Update brand
    async updateBrand(token: string, id: string, data: Partial<CreateBrandDTO & { isActive?: boolean }>) {
        const response = await this.fetch(`${this.baseUrl}/api/brands/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update brand');
        }

        return response.json();
    }

    // Delete brand
    async deleteBrand(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/brands/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete brand');
        }

        return response.json();
    }

    // ==================== EXPENSES ====================

    // Get all expenses
    async getExpenses(token: string, filters?: ExpenseFilters) {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const url = `${this.baseUrl}/api/expenses${params.toString() ? `?${params}` : ''}`;

        const response = await this.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }

        return response.json();
    }

    // Get expense by ID
    async getExpense(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/expenses/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Expense not found');
        }

        return response.json();
    }

    // Create expense
    async createExpense(token: string, data: CreateExpenseDTO) {
        const response = await this.fetch(`${this.baseUrl}/api/expenses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create expense');
        }

        return response.json();
    }

    // Update expense
    async updateExpense(token: string, id: string, data: Partial<CreateExpenseDTO & { isActive?: boolean }>) {
        const response = await this.fetch(`${this.baseUrl}/api/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update expense');
        }

        return response.json();
    }

    // Delete expense
    async deleteExpense(token: string, id: string) {
        const response = await this.fetch(`${this.baseUrl}/api/expenses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete expense');
        }

        return response.json();
    }

    // Get expense categories (for autocomplete)
    async getExpenseCategories(token: string) {
        const response = await this.fetch(`${this.baseUrl}/api/expenses/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expense categories');
        }

        return response.json();
    }

    // Get expense suppliers (for autocomplete)
    async getExpenseSuppliers(token: string) {
        const response = await this.fetch(`${this.baseUrl}/api/expenses/suppliers`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expense suppliers');
        }

        return response.json();
    }

    // Get expense statistics
    async getExpenseStatistics(token: string, startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const url = `${this.baseUrl}/api/expenses/statistics${params.toString() ? `?${params}` : ''}`;

        const response = await this.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expense statistics');
        }

        return response.json();
    }

}

export const api = new ApiClient();
