export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'staff';

export type Tenant = {
    id: number;
    name: string;
    slug: string;
    plan: string | null;
    status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';
    onTrial: boolean;
    trialDaysLeft: number;
    role: OrganizationRole | null;
};

export type Option = {
    value: string;
    label: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export type Plan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    monthly_price: string;
    yearly_price: string;
    currency: string;
    max_users: number | null;
    max_yards: number | null;
    features: string[] | null;
};

export type WeighmentDirection = 'inward' | 'outward';

export type WeighmentStatus = 'open' | 'completed' | 'cancelled';

export type Weighment = {
    id: number;
    ticket_no: string;
    direction: WeighmentDirection;
    status: WeighmentStatus;
    vehicle_number: string;
    vehicle_type: string | null;
    driver_name: string | null;
    driver_phone: string | null;
    party_name: string | null;
    material_id: number | null;
    material: Pick<Material, 'id' | 'name' | 'unit'> | null;
    first_weight: string;
    first_weighed_at: string;
    second_weight: string | null;
    second_weighed_at: string | null;
    gross_weight: string | null;
    tare_weight: string | null;
    deduction: string;
    net_weight: string | null;
    rate: string | null;
    amount: string | null;
    remarks: string | null;
    created_at: string;
};

export type InventoryItem = {
    id: number;
    name: string;
    code: string | null;
    unit: string;
    category: string;
    category_label: string;
    purchase_rate: string;
    sale_rate: string;
    is_active: boolean;
    stock: number;
    stock_value: number;
    last_movement_at: string | null;
};

export type StockMovement = {
    id: number;
    type: 'inward' | 'outward' | 'reversal' | 'adjustment';
    type_label: string;
    quantity: string;
    balance: number;
    notes: string | null;
    weighment: { id: number; ticket_no: string } | null;
    creator: { id: number; name: string } | null;
    created_at: string;
};

export type PartyType = 'supplier' | 'customer' | 'both';

export type Party = {
    id: number;
    name: string;
    type: PartyType;
    type_label: string;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    pan: string | null;
    address: string | null;
    state: string | null;
    is_active: boolean;
    /** Signed: positive = receivable (Dr), negative = payable (Cr). */
    balance: number;
};

export type LedgerRow = {
    id: number;
    date: string;
    type: 'sale' | 'purchase' | 'receipt' | 'payment' | 'reversal';
    type_label: string;
    debit: string;
    credit: string;
    narration: string | null;
    balance: number;
    weighment: { id: number; ticket_no: string } | null;
    payment: { id: number; voucher_no: string } | null;
};

export type PaymentVoucher = {
    id: number;
    voucher_no: string;
    date: string;
    type: 'receipt' | 'payment';
    type_label: string;
    mode: string;
    mode_label: string;
    amount: string;
    reference_no: string | null;
    status: 'posted' | 'cancelled';
    party: { id: number; name: string } | null;
};

export type Material = {
    id: number;
    name: string;
    code: string | null;
    category: string;
    unit: string;
    purchase_rate: string;
    sale_rate: string;
    is_active: boolean;
};
