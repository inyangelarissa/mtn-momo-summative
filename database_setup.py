import json
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class SMS(Base):
    __tablename__ = 'sms_messages'

    id = Column(Integer, primary_key=True)
    body = Column(String)
    date = Column(String)
    readable_date = Column(String)
    address = Column(String)
    category = Column(String)
    amount = Column(Float)
    transaction_id = Column(String, unique=True, nullable=True)
    timestamp = Column(Integer)

    def __repr__(self):
        return f"<SMS(id={self.id}, category='{self.category}', amount={self.amount})>"

def setup_database(db_path='sms_data.db'):
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    return engine

def insert_data(engine, json_file_path='processed_sms.json'):
    Session = sessionmaker(bind=engine)
    session = Session()

    with open(json_file_path, 'r') as f:
        data = json.load(f)

    for item in data:
        # Check for existing transaction_id to prevent duplicates
        if item.get('transaction_id'):
            existing_sms = session.query(SMS).filter_by(transaction_id=item['transaction_id']).first()
            if existing_sms:
                print(f"Skipping duplicate transaction_id: {item['transaction_id']}")
                continue

        sms = SMS(
            body=item.get('body'),
            date=item.get('date'),
            readable_date=item.get('readable_date'),
            address=item.get('address'),
            category=item.get('category'),
            amount=item.get('amount'),
            transaction_id=item.get('transaction_id'),
            timestamp=item.get('timestamp')
        )
        session.add(sms)

    session.commit()
    session.close()

if __name__ == '__main__':
    engine = setup_database()
    insert_data(engine)
    print("Database setup and data insertion complete.")


