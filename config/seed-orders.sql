-- 5 seed orders with order items
-- Uses existing UserId and ProductId references

INSERT INTO Orders (UserId, Status, CreatedAt) VALUES
(12, 'paid', '2026-02-10 09:15:00'),
(14, 'paid', '2026-02-11 14:30:00'),
(16, 'pending', '2026-02-13 11:45:00'),
(18, 'shipped', '2026-02-14 08:20:00'),
(20, 'pending', '2026-02-15 10:00:00');

INSERT INTO OrderItems (OrderId, ProductId, Quantity, Price) VALUES
(1, 1, 2, 599),
(1, 3, 1, 1299),
(2, 2, 1, 899),
(2, 5, 2, 799),
(3, 4, 3, 449),
(3, 6, 1, 1599),
(4, 7, 2, 549),
(4, 8, 1, 399),
(5, 1, 1, 599),
(5, 5, 1, 799),
(5, 3, 1, 1299);
