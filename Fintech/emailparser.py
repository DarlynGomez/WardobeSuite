#!/usr/bin/env python3

import json
import sqlite3

def update_json(j1, j2):
    j1dict = json.loads(j1)
    j2dict = json.loads(j2)
    j1dict.update(j2dict)
    return json.dumps(j1dict)

def parse_json(json_in):

    connection = sqlite3.connect("../Database/wardrobe.db")
    cursor = connection.cursor()

    purchase_amount_cents = 0
    num_purchases = 0
    merchant_freq_dict = dict()
    merchant_spending_dict = dict()
    category_freq_dict = dict()
    category_spending_dict = dict()

    data = json.loads(json_in)

    for email in data["emails"]:
        currentEmail = data["emails"][email]
        merchant = currentEmail["merchant"]

        for item in currentEmail:
            currentItem = data["emails"][email][item]
            quantity = currentItem["quantity"]
            category = currentItem["category"]

            if category in category_freq_dict.keys():
                category_freq_dict[category] += quantity
            else:
                category_freq_dict[category] = quantity

            if merchant in merchant_freq_dict.keys():
                merchant_freq_dict[merchant] += quantity
            else:
                merchant_freq_dict[merchant] = quantity

            price_cents = currentItem["price_cents"]
            num_purchases += quantity
            purchase_amount_cents += price_cents * quantity

            if merchant in merchant_spending_dict.keys():
                merchant_spending_dict[merchant] += purchase_amount_cents
            else:
                merchant_spending_dict[merchant] = purchase_amount_cents

            if category in category_spending_dict.keys():
                category_spending_dict[category] += purchase_amount_cents
            else:
                category_spending_dict[category] = purchase_amount_cents

    user_id = data["user_id"]

    merchant_freq_json = json.dumps(merchant_freq_dict)
    merchant_spending_json = json.dumps(merchant_spending_dict)
    category_freq_json = json.dumps(category_freq_dict)
    category_spending_json = json.dumps(category_spending_dict)

    cursor.execute(f"SELECT 1 FROM users WHERE user_id={user_id}")
    if cursor.fetchone() is None:
        total_spending = purchase_amount_cents
        total_purchases = num_purchases
        average_purchase = total_spending/total_purchases

        frequent_merchant = max(merchant_freq_dict, key=merchant_freq_dict.get)
        frequent_merchant_amount = merchant_freq_dict[frequent_merchant]

        most_spent_merchant = max(merchant_spending_dict, key=merchant_spending_dict.get)
        most_spent_merchant_amount = merchant_spending_dict[most_spent_merchant]

        frequent_category = max(category_freq_dict, key=merchant_freq_dict.get)
        frequent_category_amount = category_freq_dict[frequent_category]

        most_spent_category = max(category_spending_dict, key=category_spending_dict.get)
        most_spent_category_amount = category_spending_dict[most_spent_category]

        cursor.execute(f"INSERT INTO users VALUES({user_id}, {total_spending}, {total_purchases}, {average_purchase}, {frequent_merchant}, {frequent_merchant_amount}, {merchant_freq_json}, {most_spent_merchant}, {most_spent_merchant_amount}, {merchant_spending_json}, {frequent_category}, {frequent_category_amount}, {category_freq_json}, {most_spent_category}, {most_spent_category_amount}, {category_spending_json})")
    else:
        db_merchant_freq_json = cursor.execute(f"SELECT merchant_freq_json FROM users WHERE user_id = {user_id}")
        db_merchant_spending_json = cursor.execute(f"SELECT merchant_spending_json FROM users WHERE user_id = {user_id}")
        db_category_freq_json = cursor.execute(f"SELECT category_freq_json FROM users WHERE user_id = {user_id}")
        db_category_spending_json = cursor.execute(f"SELECT category_spending_json FROM users WHERE user_id = {user_id}")

        merchant_freq_json = update_json(db_merchant_freq_json, merchant_freq_json)
        merchant_spending_json = update_json(db_merchant_spending_json, merchant_spending_json)
        category_freq_json = update_json(db_category_freq_json, category_freq_json)
        category_spending_json = update_json(db_category_spending_json, category_spending_json)

        merchant_freq_dict = json.loads(merchant_freq_json)
        merchant_spending_dict = json.loads(merchant_spending_json)
        category_freq_dict = json.loads(category_freq_json)
        category_spending_dict = json.loads(category_spending_json)

        total_spending = cursor.execute(f"SELECT total_spending FROM users WHERE user_id = {user_id}") + purchase_amount_cents
        total_purchases = cursor.execute(f"SELECT  total_purchases FROM users WHERE user_id = {user_id}") + num_purchases
        average_purchase = total_spending/total_purchases

        frequent_merchant = max(merchant_freq_dict, key=merchant_freq_dict.get)
        frequent_merchant_amount = merchant_freq_dict[frequent_merchant]

        most_spent_merchant = max(merchant_spending_dict, key=merchant_spending_dict.get)
        most_spent_merchant_amount = merchant_spending_dict[most_spent_merchant]

        frequent_category = max(category_freq_dict, key=merchant_freq_dict.get)
        frequent_category_amount = category_freq_dict[frequent_category]

        cursor.execute(f"UPDATE users SET total_spending = {total_spending}, total_purchases = {total_purchases}, average_purchase = {average_purchase}, frequent_merchant = {frequent_merchant}, frequent_merchant_amount = {frequent_merchant_amount}, merchant_freq_json = {merchant_freq_json}, most_spent_merchant = {most_spent_merchant}, most_spent_merchant_amount = {most_spent_merchant_amount}, merchant_spending_json = {merchant_spending_json}, frequent_category = {frequent_category}, frequent_category_amount = {frequent_category_amount}, category_freq_json = {category_freq_json}, most_spent_category = {most_spent_category}, most_spent_category_amount  = {most_spent_category_amount}, category_spending_json = {category_spending_json} WHERE user_id = {user_id}")
