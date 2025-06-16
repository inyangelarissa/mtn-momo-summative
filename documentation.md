MoMo Data Analysis Project Report
16th June 2025

1. Executive Summary
The project report summarizes the MoMo Data Analysis project where an application to be developed full-stack which will be used for processing MTN Mobile Money SMS transaction data will consume raw SMS data and transform it into clean financial data with clean backend processing, optimal database management, and user-friendly frontend dashboard. By classifying transactions and storing them in a relational database, the app possesses important information about transaction trends, patterns, and volume. This data can be used at the point  of decision-making for further improvement of mobile money services.

2. Project Overview and Objectives
Because there was massive mobile money business in Rwanda, there were additional efforts made to process and analyze meaningful data out of SMS messages. The goal was to create a good application that would:

Parse XML-formatted SMS data: Parse meaningful data out of 1,693 SMS messages.

Transaction categorization: Categorize transactions according to predetermined business rules.

Data storage and retrieval: Save processed data in a relational database.

Deep visualization: Design an interactive web dashboard for analysis and viewing.

The goal was to derive real-time decision-making information from past trends, volumes of transactions, and cash flows to make informed decisions in resources management and service optimization.

3. Technical Architecture and Methodology
The project has a three-tier structure with the backend in Python, web frontend, and SQLite database.

3.1 Data Processing (Backend)
Data processing pipeline initiates parsing of modified_sms_v2.xml using Python. Data_processor.py script parses the data from attributes such as message body, timestamp, and sender IDs. SMS messages are classified into 9 classes (i.e., Incoming Money, Payments to Code Holders, Airtime Bill Payments) based on regular expressions. Raw data is cleaned by eliminating invalid formats, missing IDs, and duplicate dates for quality data. Clean data is saved in the form of a processed_sms.json file.

3.2 Database Design and Implementation
Database System: SQLite since it's easy and robust.

ORM: SQLAlchemy for efficient database operations and schema definitions.

Schema (sms_messages table):

Column Name
Data Type
Description
id 
INTEGER 
Primary Key, unique identifier for each SMS record. 
body
TEXT 
Full content of the SMS message
date
TEXT 
Original date string from XML. 
readable_date 
TEXT 
Human-readable date format. 
address 
TEXT 
Sender/recipient address. 
category 
TEXT 
Categorized type of the SMS transaction. 
amount
REAL 
Extracted numerical amount (RWF). 
transaction_id 
TEXT 
Unique transaction identifier (nullable, unique). 
timestamp 
INTEGER
Unix timestamp for numerical sorting.



Data Integrity: Non-duplication and failure on insertion guarantee data integrity offered by database_setup.py script. Highly queried fields like timestamp, category, and amount are indexed for performance optimization.

3.3 API Development
RESTful API api.py built using Flask is used as a frontend-to-database interface with organized data access.

Endpoints of interest:

/api/transactions: Retrieves transaction records by category, search parameters, and date range filters.

/api/statistics: Provides summary stats like total transactions, totals, average, and breakdown by month or category.

/api/categories: Retrieves all the categories of transactions.

3.4 Frontend Development
Frontend developed with HTML5, CSS3, and JavaScript (ES6+), for responsiveness and interactivity of user interface. The highlights are:

Dashboard Layout: Grid layout for desktop, tablet, smartphone screen sizes.

Interactive Graphs: Charts rendered with Chart.js to display volume of transactions, time series, and distribution analysis.

Filter and Search: Category filtering, date range filtering, live JavaScript search.

Transaction Details: Transactions are presented in detail views as a modal dialogue.

4. Implementation Details and Significant Choices
Data Processing
Regular expressions match types of SMS transactions to the correct locations. Numeric values are parsed and passed as floats to allow for calculations. Unix timestamps are converted to integer representations to be stored in normalized databases. 

Database Operations
SQLAlchemy ORM provides a high-performance data access layer. Column transaction_id with constraints (unique=True, nullable=True) ensures strong data integrity. Insertion has strict error handling and transaction rollback support as an effort to maintain database consistency.

API Integration
Frontend and backend are connected with CORS with the help of the Flask API. Query parameters are optimized during design time by SQLAlchemy to minimize the processing load on the frontend. The data aggregation is computed beforehand at the API level for the client-side computational optimization.

Frontend Architecture
Frontend takes advantage of ES6+ JavaScript syntax for usage in async operations and dynamic content updating. There exists an error avoidance feature through data reloading when there is momentary API failure. Chart.js configuration offers professional-level visualization for use in financial analysis.

5. Results and Conclusion
The system successfully processed 1,693 SMS messages, converting raw data to clean, classified data with a 99.88% success rate that is easy to analyze. The system provides excellent insights into mobile money transaction trends and behavior.

Key Insights:

Data Processing: Successfully stored and processed clean, classified data.

Database: Excellent, well-structured SQLite database with excellent data integrity and quick retrieval.

Dashboard: Easy-to-understand, easy-to-read interface to analyze the transaction activity.

Scalability: The system should be modular and scalable to expand in the future, i.e., support additional features and handle more data.
