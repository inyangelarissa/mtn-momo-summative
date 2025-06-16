
import xml.etree.ElementTree as ET
import re
import json

def parse_sms_data(xml_file_path):
    """
    Parses the XML file containing SMS data and extracts relevant information.
    """
    tree = ET.parse(xml_file_path)
    root = tree.getroot()
    sms_messages = []
    unprocessed_messages = []

    for sms_element in root.findall('sms'):
        body = sms_element.get('body')
        date = sms_element.get('date')
        readable_date = sms_element.get('readable_date')
        address = sms_element.get('address')

        if not body:
            unprocessed_messages.append({
                'type': 'missing_body',
                'raw_sms': ET.tostring(sms_element, encoding='unicode')
            })
            continue

        message_data = {
            'body': body,
            'date': date,
            'readable_date': readable_date,
            'address': address,
            'category': 'Uncategorized'
        }

        # Categorization logic
        if re.search(r'received.*RWF from', body, re.IGNORECASE):
            message_data['category'] = 'Incoming Money'
        elif re.search(r'payment of.*RWF to.*has been completed', body, re.IGNORECASE):
            message_data['category'] = 'Payments to Code Holders'
        elif re.search(r'transferred to.*RWF', body, re.IGNORECASE):
            message_data['category'] = 'Transfers to Mobile Numbers'
        elif re.search(r'bank deposit of.*RWF has been added', body, re.IGNORECASE):
            message_data['category'] = 'Bank Deposits'
        elif re.search(r'payment of.*RWF to Airtime has been completed', body, re.IGNORECASE):
            message_data['category'] = 'Airtime Bill Payments'
        elif re.search(r'purchased an internet bundle', body, re.IGNORECASE):
            message_data['category'] = 'Internet and Voice Bundle Purchases'
        elif re.search(r'withdrawn.*RWF', body, re.IGNORECASE):
            message_data['category'] = 'Withdrawals from Agents'
        elif re.search(r'transaction of.*RWF by DIRECT PAYMENT LTD', body, re.IGNORECASE):
            message_data['category'] = 'Transactions Initiated by Third Parties'
        # Add more categorization rules as needed based on the PDF's examples

        sms_messages.append(message_data)

    return sms_messages, unprocessed_messages


def clean_and_normalize_data(sms_data):
    """
    Cleans and normalizes the extracted SMS data.
    """
    cleaned_data = []
    for sms in sms_data:
        cleaned_sms = sms.copy()
        # Example cleaning: Extract amount and currency
        amount_match = re.search(r'(\d[\d,]*)\s*RWF', sms['body'], re.IGNORECASE)
        if amount_match:
            cleaned_sms['amount'] = float(amount_match.group(1).replace(',', ''))
        else:
            cleaned_sms['amount'] = None # Or handle as an unprocessed message

        # Example cleaning: Extract transaction ID
        txid_match = re.search(r'TxId:\s*(\d+)', sms['body'])
        if txid_match:
            cleaned_sms['transaction_id'] = txid_match.group(1)
        else:
            cleaned_sms['transaction_id'] = None

        # Example cleaning: Convert date to a standard format (if not already)
        # The 'date' attribute in XML is a Unix timestamp (milliseconds)
        if sms['date']:
            try:
                cleaned_sms['timestamp'] = int(sms['date'])
            except ValueError:
                cleaned_sms['timestamp'] = None
        else:
            cleaned_sms['timestamp'] = None

        cleaned_data.append(cleaned_sms)
    return cleaned_data


if __name__ == '__main__':
    xml_file = "modified_sms_v2.xml"
    # xml_file = '/home/ubuntu/upload/modified_sms_v2.xml'  
    processed_sms, unprocessed_sms = parse_sms_data(xml_file)
    cleaned_sms_data = clean_and_normalize_data(processed_sms)

    with open('processed_sms.json', 'w') as f:
        json.dump(cleaned_sms_data, f, indent=4)

    with open('unprocessed_messages.json', 'w') as f:
        json.dump(unprocessed_sms, f, indent=4)

    print(f"Processed {len(cleaned_sms_data)} SMS messages.")
    print(f"Found {len(unprocessed_sms)} unprocessed messages.")


