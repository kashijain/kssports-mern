const DEFAULT_APPROVED_SELLERS = [
  { name: 'roni', email: 'roni@kssports.com' },
  { name: 'kashish', email: 'kashish@kssports.com' },
];

const normalizeValue = (value = '') => value.trim().toLowerCase();

const parseApprovedSellers = () => {
  const envList = process.env.APPROVED_SELLERS;

  if (!envList) {
    return DEFAULT_APPROVED_SELLERS;
  }

  return envList
    .split(',')
    .map((entry) => {
      const [name = '', email = ''] = entry.split(':');
      return {
        name: normalizeValue(name),
        email: normalizeValue(email),
      };
    })
    .filter((entry) => entry.name && entry.email);
};

export const getApprovedSellers = () => parseApprovedSellers();

export const isApprovedSellerIdentity = ({ name = '', email = '' }) => {
  const normalizedName = normalizeValue(name);
  const normalizedEmail = normalizeValue(email);

  return getApprovedSellers().some(
    (seller) =>
      seller.name === normalizedName && seller.email === normalizedEmail
  );
};

export const canRegisterAsSeller = ({
  name = '',
  email = '',
  sellerSecret = '',
}) => {
  const requiredSecret = normalizeValue(process.env.SELLER_SECRET || '');
  const providedSecret = normalizeValue(sellerSecret);

  if (!requiredSecret || providedSecret !== requiredSecret) {
    return {
      allowed: false,
      message: 'Invalid seller credentials',
    };
  }

  if (!isApprovedSellerIdentity({ name, email })) {
    return {
      allowed: false,
      message: 'Seller access is restricted to approved K.S. Sports accounts',
    };
  }

  return { allowed: true };
};

export const syncUserRoleWithWhitelist = async (user) => {
  if (!user) {
    return user;
  }

  const shouldBeSeller =
    user.role === 'seller' &&
    isApprovedSellerIdentity({ name: user.name, email: user.email });

  const nextRole = shouldBeSeller ? 'seller' : 'customer';

  if (user.role !== nextRole) {
    user.role = nextRole;
    await user.save();
  }

  return user;
};
