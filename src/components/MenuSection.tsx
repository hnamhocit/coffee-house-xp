import React, { useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  TextInput,
  Tabs,
  Badge,
  Card,
  SimpleGrid,
  Group,
  Button,
  ActionIcon,
  Modal,
  Radio,
  Stack,
  Textarea,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconShoppingCartPlus,
  IconCup,
  IconSparkles,
  IconCheck,
  IconX,
  IconBolt,
  IconBrandWhatsapp,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  MENU_ITEMS,
  CATEGORIES,
  type MenuItem,
  type MenuCategory,
} from '../data/menuData';
import { siteConfig } from '../config/siteConfig';

interface MenuSectionProps {
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    ice?: string,
    sugar?: string,
    note?: string
  ) => void;
  items?: MenuItem[];
}

export const MenuSection: React.FC<MenuSectionProps> = ({ onAddToCart, items }) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sourceItems = items && items.length > 0 ? items : MENU_ITEMS;

  // Selected item modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedIce, setSelectedIce] = useState('100% Đá');
  const [selectedSugar, setSelectedSugar] = useState('100% Đường');
  const [customNote, setCustomNote] = useState('');
  const [customQuantity, setCustomQuantity] = useState(1);

  // Filtered and sorted items (Best Sellers prioritized first)
  const filteredItems = useMemo(() => {
    const list = sourceItems.filter((item) => {
      // Category filter
      if (selectedCategory === 'best-seller') {
        if (item.badge !== 'Best Seller' && item.badge !== 'Ưu Đãi') return false;
      } else if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(query);
      }
      return true;
    });

    // Ưu tiên hiển thị các món Best Seller & Ưu đãi lên trước tiên
    return [...list].sort((a, b) => {
      const isBestA = a.badge === 'Best Seller' || a.badge === 'Ưu Đãi';
      const isBestB = b.badge === 'Best Seller' || b.badge === 'Ưu Đãi';
      if (isBestA && !isBestB) return -1;
      if (!isBestA && isBestB) return 1;
      return 0;
    });
  }, [selectedCategory, searchQuery]);

  // Handle clicking on any drink card to select it
  const handleSelectDrink = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedIce('100% Đá');
    setSelectedSugar('100% Đường');
    setCustomNote('');
    setCustomQuantity(1);
  };

  // Add to cart from modal
  const handleAddToCartConfirm = () => {
    if (!selectedItem) return;

    onAddToCart(
      selectedItem,
      customQuantity,
      selectedItem.allowCustomization ? selectedIce : undefined,
      selectedItem.allowCustomization ? selectedSugar : undefined,
      customNote.trim() || undefined
    );

    notifications.show({
      title: 'Đã thêm vào giỏ hàng!',
      message: `${customQuantity}x ${selectedItem.name} (${(selectedItem.price * customQuantity).toLocaleString('vi-VN')} đ)`,
      color: 'bamboo',
      icon: <IconCheck size={18} />,
    });

    setSelectedItem(null);
  };

  // Buy now (Direct 1-tap Zalo order)
  const handleBuyNowZalo = () => {
    if (!selectedItem) return;

    const totalPrice = (selectedItem.price * customQuantity).toLocaleString('vi-VN');
    let msg = `🎋 [ĐẶT MÓN NHANH - XUÂN PHẠM COFFEE]\n`;
    msg += `• Món: ${customQuantity}x ${selectedItem.name} (${totalPrice} đ)\n`;
    if (selectedItem.allowCustomization) {
      msg += `• Mức đá: ${selectedIce}\n`;
      msg += `• Mức ngọt: ${selectedSugar}\n`;
    }
    if (customNote.trim()) {
      msg += `• Ghi chú: ${customNote.trim()}\n`;
    }
    msg += `• Tổng tiền: ${totalPrice} đ\n`;
    msg += `Quý quán cho mình đặt món này nhé!`;

    navigator.clipboard.writeText(msg);

    notifications.show({
      title: 'Đang mở Zalo của quán!',
      message: `Đã sao chép nội dung đơn: ${customQuantity}x ${selectedItem.name}. Bạn chỉ cần dán tin nhắn gửi quán.`,
      color: 'bamboo',
      autoClose: 4000,
    });

    window.open(`https://zalo.me/${siteConfig.zalo}`, '_blank');
    setSelectedItem(null);
  };

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Box
      id="thuc-don"
      py={{ base: '2rem', md: '3rem' }}
      style={{
        backgroundColor: '#f8faf8',
        borderTop: '1px solid #e4ede5',
        borderBottom: '1px solid #e4ede5',
      }}
    >
      <Container size="lg">
        {/* Search Bar & Category Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <TextInput
            placeholder="🔍 Tìm món nhanh: cà phê muối, matcha, trà đào, sinh tố bơ, nước ép cam..."
            rightSection={
              searchQuery ? (
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setSearchQuery('')}>
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="md"
            radius="md"
            mb="sm"
            style={{
              boxShadow: '0 2px 8px rgba(34, 97, 53, 0.05)',
            }}
          />

          <Tabs
            value={selectedCategory}
            onChange={(val) => setSelectedCategory((val as MenuCategory) || 'all')}
            variant="pills"
            color="bamboo"
          >
            <Tabs.List
              className="tabs-scrollable"
              justify="flex-start"
              style={{
                flexWrap: 'nowrap',
                overflowX: 'auto',
                paddingBottom: '8px',
                gap: '8px',
              }}
            >
              {CATEGORIES.map((cat) => (
                <Tabs.Tab
                  key={cat.id}
                  value={cat.id}
                  style={{
                    fontWeight: 700,
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.88rem)',
                    padding: '6px 14px',
                    whiteSpace: 'nowrap',
                    borderRadius: '20px',
                    flexShrink: 0,
                  }}
                >
                  {cat.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </div>

        {/* UNIFIED MENU GRID (ALL ITEMS WITH BEST SELLERS PRIORITIZED FIRST) */}
        <div>
          <Group justify="space-between" align="center" mb="sm" wrap="wrap" gap="xs">
            <div>
              <Title order={2} size="h3" c="#14281b" style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.15rem, 3.5vw, 1.45rem)' }}>
                {selectedCategory === 'all' && !searchQuery
                  ? `Toàn Bộ Thực Đơn (${filteredItems.length} Món)`
                  : `${CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Thực Đơn'} (${filteredItems.length} Món)`}
              </Title>
              <Text size="xs" c="#536b5a" mt={2}>
                Món bán chạy được ưu tiên lên đầu • Bấm vào món để chọn & đặt
              </Text>
            </div>

            <Group gap="xs" visibleFrom="xs">
              <Badge size="sm" variant="light" color="coffee">
                🔥 Best Seller xếp trước
              </Badge>
              <Badge size="sm" variant="light" color="bamboo">
                Giá 10k - 30k
              </Badge>
            </Group>
          </Group>

          {filteredItems.length === 0 ? (
            <Card withBorder radius="md" py="3rem" style={{ textAlign: 'center', backgroundColor: '#ffffff' }}>
              <Text size="md" fw={600} c="#2c3f33" mb="xs">
                Không tìm thấy món "{searchQuery}"
              </Text>
              <Button
                variant="outline"
                color="bamboo"
                size="xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Xem toàn bộ menu
              </Button>
            </Card>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing={{ base: 'xs', sm: 'md' }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectDrink(item)}
                  className="full-photo-card"
                >
                  {/* Full Background Photo */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="card-bg-img"
                    loading="lazy"
                  />

                  {/* Dark Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.92) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '10px 10px',
                    }}
                  >
                    {/* Top Badge */}
                    <div>
                      {item.badge && (
                        <Badge
                          size="xs"
                          variant="filled"
                          color={item.badge === 'Best Seller' ? 'coffee' : 'bamboo'}
                          style={{
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          }}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Bottom Floating Title & Price */}
                    <div>
                      <Text
                        fw={800}
                        className="line-clamp-2"
                        style={{
                          color: '#ffffff',
                          fontFamily: 'var(--font-heading)',
                          fontSize: 'clamp(0.85rem, 3.2vw, 1.02rem)',
                          lineHeight: 1.25,
                          marginBottom: '4px',
                          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          minHeight: '2.5em',
                        }}
                      >
                        {item.name}
                      </Text>

                      <Group justify="space-between" align="center" wrap="nowrap" gap={4}>
                        <Text
                          fw={800}
                          style={{
                            color: '#a3e4b2',
                            fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatPrice(item.price)}
                        </Text>

                        {/* Tactile plus button */}
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            backgroundColor: '#226135',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                            flexShrink: 0,
                          }}
                        >
                          <IconPlus size={15} stroke={3} />
                        </div>
                      </Group>
                    </div>
                  </div>
                </div>
              ))}
            </SimpleGrid>
          )}
        </div>
      </Container>

      {/* DRINK DETAIL / SELECTION POPUP WITH "MUA NGAY" VÀ "THÊM VÀO GIỎ HÀNG" */}
      <Modal
        opened={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={
          <Group gap="xs">
            <IconCup size={20} color="#226135" />
            <Text fw={700} c="#14281b" size="md" style={{ fontFamily: 'var(--font-heading)' }}>
              Chi Tiết Món Đã Chọn
            </Text>
          </Group>
        }
        centered
        size="md"
        padding="md"
      >
        {selectedItem && (
          <Stack gap="md">
            {/* Drink preview card */}
            <div
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                backgroundColor: '#f8faf8',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2ede4',
              }}
            >
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div>
                <Text fw={800} size="md" c="#14281b" style={{ fontFamily: 'var(--font-heading)' }}>
                  {selectedItem.name}
                </Text>
                <Text fw={800} size="lg" c="#226135">
                  {formatPrice(selectedItem.price * customQuantity)}
                </Text>
              </div>
            </div>

            {/* Customization Options */}
            {selectedItem.allowCustomization && (
              <>
                {/* Ice option */}
                <div>
                  <Text fw={700} size="xs" c="#14281b" mb={6}>
                    Mức Đá:
                  </Text>
                  <Radio.Group value={selectedIce} onChange={setSelectedIce}>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                      <Radio value="100% Đá" label="100% Đá" color="bamboo" size="sm" />
                      <Radio value="70% Đá" label="70% Đá" color="bamboo" size="sm" />
                      <Radio value="50% Đá" label="50% Đá" color="bamboo" size="sm" />
                      <Radio value="Không Đá" label="Đá Riêng" color="bamboo" size="sm" />
                    </SimpleGrid>
                  </Radio.Group>
                </div>

                {/* Sugar option */}
                <div>
                  <Text fw={700} size="xs" c="#14281b" mb={6}>
                    Mức Ngọt / Đường:
                  </Text>
                  <Radio.Group value={selectedSugar} onChange={setSelectedSugar}>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                      <Radio value="100% Đường" label="Ngọt Vừa" color="bamboo" size="sm" />
                      <Radio value="70% Đường" label="70%" color="bamboo" size="sm" />
                      <Radio value="50% Đường" label="Ít Ngọt" color="bamboo" size="sm" />
                      <Radio value="Không Đường" label="Không Đường" color="bamboo" size="sm" />
                    </SimpleGrid>
                  </Radio.Group>
                </div>

                {/* Note */}
                <div>
                  <Text fw={700} size="xs" c="#14281b" mb={4}>
                    Ghi chú cho quầy pha chế:
                  </Text>
                  <Textarea
                    placeholder="Ví dụ: Nhiều kem muối, để đá riêng, lấy thêm ly đá..."
                    value={customNote}
                    onChange={(e) => setCustomNote(e.currentTarget.value)}
                    minRows={2}
                    maxRows={2}
                    radius="md"
                    size="sm"
                  />
                </div>
              </>
            )}

            {/* Quantity */}
            <Group justify="space-between" align="center">
              <Text fw={700} size="sm" c="#14281b">
                Số lượng:
              </Text>
              <Group gap="xs">
                <ActionIcon
                  size="md"
                  variant="default"
                  disabled={customQuantity <= 1}
                  onClick={() => setCustomQuantity(Math.max(1, customQuantity - 1))}
                >
                  <IconMinus size={14} />
                </ActionIcon>
                <Text fw={800} style={{ minWidth: 28, textAlign: 'center' }}>
                  {customQuantity}
                </Text>
                <ActionIcon
                  size="md"
                  variant="default"
                  onClick={() => setCustomQuantity(customQuantity + 1)}
                >
                  <IconPlus size={14} />
                </ActionIcon>
              </Group>
            </Group>

            <Divider />

            {/* 2 PROMINENT ACTION BUTTONS: MUA NGAY (ZALO) & THÊM VÀO GIỎ HÀNG */}
            <Stack gap="xs">
              <Button
                color="bamboo"
                size="md"
                fullWidth
                leftSection={<IconShoppingCartPlus size={20} />}
                onClick={handleAddToCartConfirm}
                style={{
                  backgroundColor: '#226135',
                  fontWeight: 700,
                  height: '46px',
                  fontSize: '1rem',
                  boxShadow: '0 4px 14px rgba(34, 97, 53, 0.3)',
                }}
              >
                Thêm Vào Giỏ Hàng • {formatPrice(selectedItem.price * customQuantity)}
              </Button>

              <Button
                variant="filled"
                size="md"
                fullWidth
                leftSection={<IconBolt size={20} />}
                onClick={handleBuyNowZalo}
                style={{
                  backgroundColor: '#0068ff',
                  color: '#ffffff',
                  fontWeight: 700,
                  height: '46px',
                  fontSize: '1rem',
                  boxShadow: '0 4px 14px rgba(0, 104, 255, 0.3)',
                }}
              >
                Mua Ngay (Gửi Zalo Quán)
              </Button>
            </Stack>
          </Stack>
        )}
      </Modal>
    </Box>
  );
};
