from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from database_setup import SMS
import json

app = Flask(__name__)
CORS(app)

# Database setup
engine = create_engine('sqlite:///sms_data.db')
Session = sessionmaker(bind=engine)

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    session = Session()
    
    # Get query parameters
    category = request.args.get('category')
    search = request.args.get('search')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    limit = request.args.get('limit', 100, type=int)
    
    # Build query
    query = session.query(SMS)
    
    if category:
        query = query.filter(SMS.category == category)
    
    if search:
        query = query.filter(SMS.body.contains(search))
    
    if date_from:
        # Convert date string to timestamp (assuming format YYYY-MM-DD)
        from datetime import datetime
        date_obj = datetime.strptime(date_from, '%Y-%m-%d')
        timestamp = int(date_obj.timestamp() * 1000)
        query = query.filter(SMS.timestamp >= timestamp)
    
    if date_to:
        from datetime import datetime
        date_obj = datetime.strptime(date_to, '%Y-%m-%d')
        timestamp = int(date_obj.timestamp() * 1000) + 86400000  # Add 24 hours
        query = query.filter(SMS.timestamp <= timestamp)
    
    # Execute query with limit
    transactions = query.limit(limit).all()
    
    # Convert to JSON-serializable format
    result = []
    for transaction in transactions:
        result.append({
            'id': transaction.id,
            'body': transaction.body,
            'date': transaction.date,
            'readable_date': transaction.readable_date,
            'address': transaction.address,
            'category': transaction.category,
            'amount': transaction.amount,
            'transaction_id': transaction.transaction_id,
            'timestamp': transaction.timestamp
        })
    
    session.close()
    return jsonify(result)

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    session = Session()
    
    # Get basic statistics
    total_transactions = session.query(SMS).count()
    total_amount = session.query(func.sum(SMS.amount)).scalar() or 0
    avg_amount = session.query(func.avg(SMS.amount)).scalar() or 0
    
    # Get category breakdown
    category_stats = session.query(
        SMS.category,
        func.count(SMS.id).label('count'),
        func.sum(SMS.amount).label('total_amount')
    ).group_by(SMS.category).all()
    
    category_data = {}
    for stat in category_stats:
        category_data[stat.category] = {
            'count': stat.count,
            'total_amount': stat.total_amount or 0
        }
    
    # Get monthly data
    monthly_stats = session.query(
        func.strftime('%Y-%m', func.datetime(SMS.timestamp/1000, 'unixepoch')).label('month'),
        func.count(SMS.id).label('count'),
        func.sum(SMS.amount).label('total_amount')
    ).group_by('month').all()
    
    monthly_data = {}
    for stat in monthly_stats:
        if stat.month:  # Only include valid months
            monthly_data[stat.month] = {
                'count': stat.count,
                'total_amount': stat.total_amount or 0
            }
    
    result = {
        'total_transactions': total_transactions,
        'total_amount': total_amount,
        'avg_amount': avg_amount,
        'category_breakdown': category_data,
        'monthly_breakdown': monthly_data
    }
    
    session.close()
    return jsonify(result)

@app.route('/api/categories', methods=['GET'])
def get_categories():
    session = Session()
    categories = session.query(SMS.category).distinct().all()
    result = [cat[0] for cat in categories if cat[0]]
    session.close()
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

