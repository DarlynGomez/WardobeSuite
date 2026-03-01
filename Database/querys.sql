DROP TABLE users;

CREATE TABLE users (
    user_id INT PRIMARY KEY,
    total_spending INT,
    total_purchases INT,
    average_purchase INT,
    frequent_merchant VARCHAR,
    frequent_merchant_amount INT,
    merchant_freq_json BLOB,
    most_spent_merchant VARCHAR,
    most_spent_merchant_amount INT,
    merchant_spending_json BLOB,
    frequent_catagory VARCHAR,
    frequent_catagory_amount INT,
    catagory_freq_json BLOB,
    most_spent_catagory VARCHAR,
    most_spent_catagory_amount INT,
    catagory_spending_json BLOB
);
