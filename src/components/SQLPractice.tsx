import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, RotateCcw } from 'lucide-react';

interface Exercise {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  scenario: string;
  task: string;
  schema?: string;
  hints: string[];
  solution: string;
  keywords: string[];        // All must appear (case-insensitive)
  explanation: string;
}

const exercises: Exercise[] = [
  // ── ARCHITECTURE / BASICS ────────────────────────────────────────────
  {
    id: 'ex-01', difficulty: 'easy', topic: 'Warehouses',
    title: 'Create a Virtual Warehouse',
    scenario: 'You need a new XS warehouse for development use that auto-suspends after 5 minutes.',
    task: 'Write the SQL to create a warehouse called DEV_WH that is X-Small, auto-suspends after 300 seconds, and auto-resumes.',
    schema: '',
    hints: ['Use CREATE WAREHOUSE', 'WAREHOUSE_SIZE = \'XSMALL\'', 'AUTO_SUSPEND = 300', 'AUTO_RESUME = TRUE'],
    solution: `CREATE WAREHOUSE DEV_WH
  WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 300
  AUTO_RESUME = TRUE;`,
    keywords: ['create warehouse', 'dev_wh', 'xsmall', 'auto_suspend', '300', 'auto_resume'],
    explanation: 'WAREHOUSE_SIZE accepts XSMALL, SMALL, MEDIUM, LARGE, XLARGE, X2LARGE, X3LARGE, X4LARGE. AUTO_SUSPEND takes seconds (minimum 60). AUTO_RESUME = TRUE means queries resume it automatically.',
  },
  {
    id: 'ex-02', difficulty: 'easy', topic: 'Databases & Schemas',
    title: 'Database and Schema Setup',
    scenario: 'You are building a new analytics database for the marketing team.',
    task: 'Create a database called MARKETING_DB, then create a schema called REPORTS inside it.',
    schema: '',
    hints: ['CREATE DATABASE', 'CREATE SCHEMA', 'Use MARKETING_DB.REPORTS or switch context with USE DATABASE'],
    solution: `CREATE DATABASE MARKETING_DB;
CREATE SCHEMA MARKETING_DB.REPORTS;`,
    keywords: ['create database', 'marketing_db', 'create schema', 'reports'],
    explanation: 'You can qualify the schema with the database name (MARKETING_DB.REPORTS) or first USE DATABASE MARKETING_DB and then CREATE SCHEMA REPORTS. Both approaches are valid.',
  },
  {
    id: 'ex-03', difficulty: 'easy', topic: 'Time Travel',
    title: 'Query Historical Data',
    scenario: 'A colleague accidentally deleted some orders yesterday. You need to check what the ORDERS table contained 24 hours ago.',
    task: 'Write a SELECT query to retrieve all rows from ORDERS as they existed 24 hours ago using Time Travel.',
    schema: 'Table: ORDERS (order_id, customer_id, amount, created_at)',
    hints: ['Use AT(OFFSET => ...) syntax', '24 hours = 86400 seconds', 'Offset must be negative for past'],
    solution: `SELECT *
FROM ORDERS
AT(OFFSET => -86400);`,
    keywords: ['select', 'orders', 'at', 'offset', '-86400'],
    explanation: 'AT(OFFSET => -86400) queries the table as it existed 86400 seconds (24 hours) ago. You can also use AT(TIMESTAMP => \'2024-01-01\'::TIMESTAMP) or AT(STATEMENT => \'<query_id>\') for point-in-time recovery.',
  },
  {
    id: 'ex-04', difficulty: 'easy', topic: 'Cloning',
    title: 'Zero-Copy Clone',
    scenario: 'You want to create a development copy of the PRODUCTION_ORDERS table for testing without duplicating storage.',
    task: 'Create a zero-copy clone of PRODUCTION_ORDERS called DEV_ORDERS.',
    schema: '',
    hints: ['CREATE TABLE ... CLONE ...', 'No data is physically copied', 'The clone shares micro-partitions with the original'],
    solution: `CREATE TABLE DEV_ORDERS
  CLONE PRODUCTION_ORDERS;`,
    keywords: ['create table', 'dev_orders', 'clone', 'production_orders'],
    explanation: 'Zero-copy cloning duplicates only metadata and micro-partition pointers. No data is physically copied, so it is instantaneous and costs no initial storage. Write operations on either table later trigger copy-on-write of affected micro-partitions.',
  },
  // ── SECURITY / RBAC ──────────────────────────────────────────────────
  {
    id: 'ex-05', difficulty: 'easy', topic: 'RBAC',
    title: 'Create Role and Grant Privileges',
    scenario: 'You need to create a new ANALYST role and give it read-only access to the SALES table.',
    task: 'Create the ANALYST role, grant USAGE on DATABASE CORP_DB and SCHEMA CORP_DB.PUBLIC, then grant SELECT on SALES to ANALYST.',
    schema: 'Database: CORP_DB | Schema: CORP_DB.PUBLIC | Table: SALES',
    hints: ['CREATE ROLE', 'GRANT USAGE ON DATABASE', 'GRANT USAGE ON SCHEMA', 'GRANT SELECT ON TABLE'],
    solution: `CREATE ROLE ANALYST;

GRANT USAGE ON DATABASE CORP_DB TO ROLE ANALYST;
GRANT USAGE ON SCHEMA CORP_DB.PUBLIC TO ROLE ANALYST;
GRANT SELECT ON TABLE CORP_DB.PUBLIC.SALES TO ROLE ANALYST;`,
    keywords: ['create role', 'analyst', 'grant usage', 'corp_db', 'grant select', 'sales'],
    explanation: 'In Snowflake\'s RBAC, you need USAGE on the database AND schema before SELECT on the table works. Without USAGE on the parent containers, the privilege grants are effectively unreachable.',
  },
  {
    id: 'ex-06', difficulty: 'medium', topic: 'RBAC',
    title: 'Future Grants',
    scenario: 'Your team creates new tables in the ANALYTICS schema regularly. You want the ANALYST role to automatically get SELECT on every new table without manual grants.',
    task: 'Write the SQL to grant SELECT on all future tables in ANALYTICS schema to the ANALYST role.',
    schema: 'Database: CORP_DB | Schema: CORP_DB.ANALYTICS',
    hints: ['GRANT SELECT ON FUTURE TABLES', 'IN SCHEMA syntax', 'This applies to tables created AFTER the grant'],
    solution: `GRANT SELECT ON FUTURE TABLES
  IN SCHEMA CORP_DB.ANALYTICS
  TO ROLE ANALYST;`,
    keywords: ['grant select', 'future tables', 'in schema', 'corp_db.analytics', 'analyst'],
    explanation: 'FUTURE GRANTS ensure that any table created in CORP_DB.ANALYTICS after this grant is issued will automatically have SELECT granted to ANALYST. Without future grants, every new table needs a manual grant.',
  },
  {
    id: 'ex-07', difficulty: 'easy', topic: 'Users',
    title: 'Create a User',
    scenario: 'A new data engineer named Sarah is joining the team.',
    task: 'Create a Snowflake user called SARAH_JONES with password \'Temp1234!\', default role SYSADMIN, and default warehouse COMPUTE_WH.',
    schema: '',
    hints: ['CREATE USER', 'PASSWORD =', 'DEFAULT_ROLE =', 'DEFAULT_WAREHOUSE ='],
    solution: `CREATE USER SARAH_JONES
  PASSWORD = 'Temp1234!'
  DEFAULT_ROLE = SYSADMIN
  DEFAULT_WAREHOUSE = COMPUTE_WH
  MUST_CHANGE_PASSWORD = TRUE;`,
    keywords: ['create user', 'sarah_jones', 'password', 'default_role', 'sysadmin', 'default_warehouse'],
    explanation: 'MUST_CHANGE_PASSWORD = TRUE is a best practice for temporary passwords. Always assign a DEFAULT_ROLE and DEFAULT_WAREHOUSE to reduce friction when users first log in. Remember to also GRANT ROLE SYSADMIN TO USER SARAH_JONES separately.',
  },
  // ── DATA LOADING ─────────────────────────────────────────────────────
  {
    id: 'ex-08', difficulty: 'easy', topic: 'Stages',
    title: 'Create a Named Stage',
    scenario: 'You need a named internal stage for loading CSV files into the SALES table.',
    task: 'Create a named internal stage called MY_CSV_STAGE with a CSV file format (comma delimiter, skip header row).',
    schema: '',
    hints: ['CREATE STAGE', 'FILE_FORMAT = (TYPE = CSV)', 'FIELD_DELIMITER', 'SKIP_HEADER = 1'],
    solution: `CREATE STAGE MY_CSV_STAGE
  FILE_FORMAT = (
    TYPE = 'CSV'
    FIELD_DELIMITER = ','
    SKIP_HEADER = 1
  );`,
    keywords: ['create stage', 'my_csv_stage', 'file_format', 'csv', 'skip_header'],
    explanation: 'Named internal stages are schema-level objects that can be shared across multiple COPY INTO commands. You can also create a named FILE FORMAT object separately and reference it in the stage or COPY INTO command.',
  },
  {
    id: 'ex-09', difficulty: 'medium', topic: 'COPY INTO',
    title: 'Load Data from a Stage',
    scenario: 'Files have been uploaded to MY_CSV_STAGE. Load them into the ORDERS table, skipping files with errors, and delete files after loading.',
    task: 'Write a COPY INTO statement to load from MY_CSV_STAGE into ORDERS, with ON_ERROR = SKIP_FILE and PURGE = TRUE.',
    schema: 'Stage: MY_CSV_STAGE | Table: ORDERS',
    hints: ['COPY INTO table FROM @stage', 'ON_ERROR = SKIP_FILE', 'PURGE = TRUE'],
    solution: `COPY INTO ORDERS
FROM @MY_CSV_STAGE
ON_ERROR = 'SKIP_FILE'
PURGE = TRUE;`,
    keywords: ['copy into', 'orders', 'my_csv_stage', 'on_error', 'skip_file', 'purge'],
    explanation: 'SKIP_FILE skips entire files with errors (use CONTINUE to skip individual bad records). PURGE = TRUE removes successfully loaded files from the stage. Files that errored are NOT purged.',
  },
  {
    id: 'ex-10', difficulty: 'medium', topic: 'Snowpipe',
    title: 'Create a Snowpipe',
    scenario: 'You want to automatically ingest CSV files that land in an external stage MY_S3_STAGE into the EVENTS table.',
    task: 'Create a Snowpipe called EVENTS_PIPE with auto_ingest enabled that runs COPY INTO EVENTS FROM @MY_S3_STAGE.',
    schema: '',
    hints: ['CREATE PIPE', 'AUTO_INGEST = TRUE', 'AS COPY INTO ...'],
    solution: `CREATE PIPE EVENTS_PIPE
  AUTO_INGEST = TRUE
AS
COPY INTO EVENTS
FROM @MY_S3_STAGE
FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 1);`,
    keywords: ['create pipe', 'events_pipe', 'auto_ingest', 'true', 'copy into', 'events'],
    explanation: 'AUTO_INGEST = TRUE requires a cloud event notification (SQS/Event Grid/Pub-Sub) configured on the storage bucket to notify Snowpipe when new files arrive. The COPY INTO inside the pipe definition is the load specification.',
  },
  // ── SEMI-STRUCTURED / TRANSFORMATIONS ────────────────────────────────
  {
    id: 'ex-11', difficulty: 'medium', topic: 'Semi-Structured',
    title: 'Query JSON in a VARIANT Column',
    scenario: 'A table EVENTS has a VARIANT column called PAYLOAD containing: {"user_id": 42, "action": "click", "metadata": {"page": "/home"}}',
    task: 'Write a SELECT that extracts user_id (as INTEGER), action (as STRING), and the nested page from metadata.',
    schema: 'Table: EVENTS(event_id INT, payload VARIANT)',
    hints: ['Use : for path access', ':: for type casting', 'payload:user_id::INTEGER', 'payload:metadata:page::STRING'],
    solution: `SELECT
  event_id,
  payload:user_id::INTEGER    AS user_id,
  payload:action::STRING      AS action,
  payload:metadata:page::STRING AS page
FROM EVENTS;`,
    keywords: ['select', 'payload', '::', 'integer', 'string', 'events'],
    explanation: 'The colon (:) traverses nested JSON paths. Double-colon (::) casts the VARIANT to a SQL type. Without ::, the value is returned as a VARIANT. Always cast to a concrete type when you need proper comparison or aggregation.',
  },
  {
    id: 'ex-12', difficulty: 'hard', topic: 'Semi-Structured',
    title: 'Flatten an Array',
    scenario: 'A PRODUCTS table has a VARIANT column TAGS containing an array: ["electronics", "laptop", "portable"]. You need one row per tag.',
    task: 'Write a query using FLATTEN to explode the TAGS array into individual rows, returning product_id and the tag value as a string.',
    schema: 'Table: PRODUCTS(product_id INT, tags VARIANT)',
    hints: ['Use LATERAL FLATTEN', 'Input: tags column', 'f.value for each element', '::STRING to cast'],
    solution: `SELECT
  p.product_id,
  f.value::STRING AS tag
FROM PRODUCTS p,
  LATERAL FLATTEN(input => p.tags) f;`,
    keywords: ['select', 'flatten', 'lateral', 'tags', 'value', 'products'],
    explanation: 'LATERAL FLATTEN is a table function that explodes an array or object into rows. The alias f gives access to: f.value (element value), f.index (array index), f.key (object key), f.path (full path). LATERAL means it can reference columns from the preceding FROM clause.',
  },
  {
    id: 'ex-13', difficulty: 'medium', topic: 'Streams',
    title: 'Create a Stream',
    scenario: 'You want to capture all changes (INSERT, UPDATE, DELETE) to the ORDERS table for a downstream CDC pipeline.',
    task: 'Create a standard stream called ORDERS_STREAM on the ORDERS table.',
    schema: 'Table: ORDERS',
    hints: ['CREATE STREAM', 'ON TABLE syntax'],
    solution: `CREATE STREAM ORDERS_STREAM
  ON TABLE ORDERS;`,
    keywords: ['create stream', 'orders_stream', 'on table', 'orders'],
    explanation: 'This creates a standard stream that captures all DML changes (INSERT, UPDATE, DELETE). For INSERT-only tables, use CREATE STREAM ... ON TABLE ... APPEND_ONLY = TRUE for better efficiency. The stream tracks changes since the last time it was consumed.',
  },
  {
    id: 'ex-14', difficulty: 'medium', topic: 'Streams',
    title: 'Consume a Stream with MERGE',
    scenario: 'You have ORDERS_STREAM with new inserts. Merge new orders into the ORDERS_SUMMARY table (upsert by order_id).',
    task: 'Write a MERGE statement that inserts new orders from ORDERS_STREAM into ORDERS_SUMMARY when order_id doesn\'t exist, or updates amount when it does.',
    schema: 'Stream: ORDERS_STREAM(order_id, customer_id, amount, METADATA$ACTION)\nTable: ORDERS_SUMMARY(order_id, customer_id, total_amount)',
    hints: ['MERGE INTO target USING source ON ...', 'WHEN MATCHED THEN UPDATE', 'WHEN NOT MATCHED THEN INSERT', 'Filter stream for INSERT action'],
    solution: `MERGE INTO ORDERS_SUMMARY AS t
USING (
  SELECT order_id, customer_id, amount
  FROM ORDERS_STREAM
  WHERE METADATA$ACTION = 'INSERT'
) AS s
ON t.order_id = s.order_id
WHEN MATCHED THEN
  UPDATE SET t.total_amount = s.amount
WHEN NOT MATCHED THEN
  INSERT (order_id, customer_id, total_amount)
  VALUES (s.order_id, s.customer_id, s.amount);`,
    keywords: ['merge into', 'orders_summary', 'using', 'orders_stream', 'when matched', 'when not matched', 'metadata$action'],
    explanation: 'Consuming a stream in a DML statement (MERGE, INSERT, UPDATE) advances the stream offset. METADATA$ACTION = \'INSERT\' filters for new inserts. An UPDATE in the source appears as a DELETE + INSERT pair in the stream.',
  },
  {
    id: 'ex-15', difficulty: 'medium', topic: 'Tasks',
    title: 'Create a Scheduled Task',
    scenario: 'You want to run a stored procedure REFRESH_SUMMARY every 15 minutes.',
    task: 'Create a task called REFRESH_TASK using COMPUTE_WH that calls CALL REFRESH_SUMMARY() every 15 minutes. Remember to resume it.',
    schema: '',
    hints: ['CREATE TASK', 'WAREHOUSE = COMPUTE_WH', 'SCHEDULE = \'15 MINUTE\'', 'AS CALL REFRESH_SUMMARY()', 'ALTER TASK RESUME'],
    solution: `CREATE TASK REFRESH_TASK
  WAREHOUSE = COMPUTE_WH
  SCHEDULE = '15 MINUTE'
AS
  CALL REFRESH_SUMMARY();

ALTER TASK REFRESH_TASK RESUME;`,
    keywords: ['create task', 'refresh_task', 'warehouse', 'schedule', '15 minute', 'call', 'refresh_summary', 'alter task', 'resume'],
    explanation: 'Tasks are created in SUSPENDED state — you MUST run ALTER TASK ... RESUME to activate them. The SCHEDULE supports interval (\'n MINUTE\') and CRON (\'USING CRON expr tz\') formats. Serverless tasks omit WAREHOUSE and use USER_TASK_MANAGED_INITIAL_WAREHOUSE_SIZE instead.',
  },
  // ── PERFORMANCE ──────────────────────────────────────────────────────
  {
    id: 'ex-16', difficulty: 'medium', topic: 'Clustering',
    title: 'Add a Clustering Key',
    scenario: 'Queries on the TRANSACTIONS table are slow because they filter heavily on the ORDER_DATE column and the table is multi-terabyte.',
    task: 'Add a clustering key on ORDER_DATE to the TRANSACTIONS table.',
    schema: 'Table: TRANSACTIONS(tx_id, order_date DATE, amount, customer_id)',
    hints: ['ALTER TABLE ... CLUSTER BY', 'Specify the column(s)'],
    solution: `ALTER TABLE TRANSACTIONS
  CLUSTER BY (ORDER_DATE);`,
    keywords: ['alter table', 'transactions', 'cluster by', 'order_date'],
    explanation: 'ALTER TABLE ... CLUSTER BY triggers automatic background re-clustering (using serverless credits). Clustering keys are most useful for large tables (multi-TB) with range-based predicates on the clustered column. Too many clustering keys on small tables wastes credits with no benefit.',
  },
  {
    id: 'ex-17', difficulty: 'hard', topic: 'Search Optimisation',
    title: 'Enable Search Optimisation',
    scenario: 'Users frequently look up individual customer records by CUSTOMER_ID in a 500M row CUSTOMERS table. Clustering doesn\'t help because it\'s a point lookup.',
    task: 'Enable Search Optimisation on the CUSTOMER_ID column of the CUSTOMERS table for equality lookups.',
    schema: 'Table: CUSTOMERS(customer_id VARCHAR, name, email, ...)',
    hints: ['ALTER TABLE ... ADD SEARCH OPTIMIZATION', 'ON EQUALITY(col)'],
    solution: `ALTER TABLE CUSTOMERS
  ADD SEARCH OPTIMIZATION
  ON EQUALITY(CUSTOMER_ID);`,
    keywords: ['alter table', 'customers', 'add search optimization', 'equality', 'customer_id'],
    explanation: 'Search Optimization Service (SOS) builds a server-side access path index for point lookups. ON EQUALITY(col) optimises equality predicates. ON SUBSTRING(col) optimises LIKE/ILIKE. ON GEO(col) optimises geospatial queries. Requires Enterprise Edition.',
  },
  // ── DATA PROTECTION ──────────────────────────────────────────────────
  {
    id: 'ex-18', difficulty: 'easy', topic: 'Time Travel',
    title: 'Restore a Dropped Table',
    scenario: 'The CUSTOMERS table was dropped accidentally 2 hours ago. Time Travel retention is 24 hours.',
    task: 'Write the SQL to restore the dropped CUSTOMERS table.',
    schema: '',
    hints: ['UNDROP TABLE', 'Works within the Time Travel window'],
    solution: `UNDROP TABLE CUSTOMERS;`,
    keywords: ['undrop table', 'customers'],
    explanation: 'UNDROP TABLE restores a dropped table within its Data Retention Period. UNDROP works for TABLE, SCHEMA, and DATABASE. After the retention period expires, the data moves to Fail-safe and can only be recovered by Snowflake Support.',
  },
  {
    id: 'ex-19', difficulty: 'medium', topic: 'Data Sharing',
    title: 'Create a Data Share',
    scenario: 'You want to share the REVENUE_SUMMARY view with a partner account (partner_account_id: PARTNER123).',
    task: 'Create a share called REVENUE_SHARE, grant USAGE on DATABASE ANALYTICS_DB, USAGE on SCHEMA PUBLIC, SELECT on VIEW REVENUE_SUMMARY, then add PARTNER123 to the share.',
    schema: 'Database: ANALYTICS_DB | Schema: PUBLIC | View: REVENUE_SUMMARY',
    hints: ['CREATE SHARE', 'GRANT USAGE ON DATABASE/SCHEMA TO SHARE', 'GRANT SELECT ON VIEW TO SHARE', 'ALTER SHARE ADD ACCOUNTS'],
    solution: `CREATE SHARE REVENUE_SHARE;

GRANT USAGE ON DATABASE ANALYTICS_DB TO SHARE REVENUE_SHARE;
GRANT USAGE ON SCHEMA ANALYTICS_DB.PUBLIC TO SHARE REVENUE_SHARE;
GRANT SELECT ON VIEW ANALYTICS_DB.PUBLIC.REVENUE_SUMMARY TO SHARE REVENUE_SHARE;

ALTER SHARE REVENUE_SHARE ADD ACCOUNTS = PARTNER123;`,
    keywords: ['create share', 'revenue_share', 'grant usage', 'analytics_db', 'grant select', 'revenue_summary', 'alter share', 'add accounts', 'partner123'],
    explanation: 'Data sharing grants are made to the SHARE object (not a role). The consumer creates a database FROM the share: CREATE DATABASE partner_db FROM SHARE provider_account.REVENUE_SHARE. No data is copied — the consumer queries your live data.',
  },
  {
    id: 'ex-20', difficulty: 'hard', topic: 'Dynamic Data Masking',
    title: 'Create a Masking Policy',
    scenario: 'EMAIL column should be fully visible to ANALYST role but masked as \'****@****.com\' for all other roles.',
    task: 'Create a masking policy called EMAIL_MASK that shows the real value to ANALYST role, and shows \'****@****.com\' to all others. Then apply it to the EMAIL column on CUSTOMERS.',
    schema: 'Table: CUSTOMERS(customer_id, name, email VARCHAR)',
    hints: ['CREATE MASKING POLICY', 'RETURNS VARCHAR', 'CASE WHEN CURRENT_ROLE() = \'ANALYST\' THEN val ELSE \'****@****.com\' END', 'ALTER TABLE ... MODIFY COLUMN ... SET MASKING POLICY'],
    solution: `CREATE MASKING POLICY EMAIL_MASK
AS (val VARCHAR) RETURNS VARCHAR ->
  CASE
    WHEN CURRENT_ROLE() = 'ANALYST' THEN val
    ELSE '****@****.com'
  END;

ALTER TABLE CUSTOMERS
  MODIFY COLUMN EMAIL
  SET MASKING POLICY EMAIL_MASK;`,
    keywords: ['create masking policy', 'email_mask', 'returns varchar', 'current_role', 'analyst', 'alter table', 'customers', 'modify column', 'email', 'set masking policy'],
    explanation: 'Masking policies are schema-level objects. The policy function takes the column value as input and returns either the real or masked value based on the querying context (role, session variables, etc.). Requires Enterprise Edition. Policies can use IS_ROLE_IN_SESSION() for hierarchical role checks.',
  },
];

const TOPICS = ['All', ...Array.from(new Set(exercises.map(e => e.topic)))];
const DIFFS = ['All', 'easy', 'medium', 'hard'] as const;
const STORAGE_KEY = 'snowflake-practice-progress';

export default function SQLPractice() {
  const [filterTopic, setFilterTopic] = useState('All');
  const [filterDiff, setFilterDiff] = useState<string>('All');
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, 'correct' | 'partial' | null>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const saveCompleted = (c: Set<string>) => {
    setCompleted(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...c]));
  };

  const filtered = exercises.filter(e => {
    const topicMatch = filterTopic === 'All' || e.topic === filterTopic;
    const diffMatch = filterDiff === 'All' || e.difficulty === filterDiff;
    return topicMatch && diffMatch;
  });

  function checkAnswer(ex: Exercise) {
    const code = (userCode[ex.id] || '').toLowerCase().replace(/\s+/g, ' ');
    const allMatch = ex.keywords.every(kw => code.includes(kw.toLowerCase()));
    const result: 'correct' | 'partial' = allMatch ? 'correct' : 'partial';
    setResults(prev => ({ ...prev, [ex.id]: result }));
    if (allMatch) {
      const nc = new Set(completed);
      nc.add(ex.id);
      saveCompleted(nc);
    }
  }

  const diffColor = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };
  const diffBg = { easy: '#f0fdf4', medium: '#fffbeb', hard: '#fef2f2' };

  return (
    <div>
      {/* Progress bar */}
      {isClient && (
        <div className="card mb-8 p-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black" style={{ color: 'var(--color-snowflake-blue)' }}>{completed.size}</span>
              <span className="text-slate-500 text-sm">/ {exercises.length} exercises completed</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: '8px', background: '#e2e8f0' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(completed.size / exercises.length) * 100}%`,
                  background: 'linear-gradient(90deg, var(--color-snowflake-blue), var(--color-snowflake-sky))',
                  transition: 'width 0.5s',
                }}
              />
            </div>
          </div>
          <button
            onClick={() => { if (confirm('Reset all practice progress?')) saveCompleted(new Set()); }}
            className="text-xs text-slate-400 hover:text-red-500"
          >
            Reset
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TOPICS.map(t => (
          <button key={t} onClick={() => setFilterTopic(t)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterTopic === t ? 'var(--color-snowflake-blue)' : '#f1f5f9',
              color: filterTopic === t ? 'white' : '#475569',
            }}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-8">
        {DIFFS.map(d => (
          <button key={d} onClick={() => setFilterDiff(d)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize"
            style={{
              borderColor: filterDiff === d ? (d === 'All' ? 'var(--color-snowflake-blue)' : diffColor[d as 'easy' | 'medium' | 'hard'] || 'var(--color-snowflake-blue)') : '#e2e8f0',
              background: filterDiff === d ? (d === 'All' ? 'var(--color-snowflake-light)' : diffBg[d as 'easy' | 'medium' | 'hard'] || '#f0f9ff') : 'white',
              color: filterDiff === d ? (d === 'All' ? 'var(--color-snowflake-dark)' : diffColor[d as 'easy' | 'medium' | 'hard'] || 'var(--color-snowflake-dark)') : '#64748b',
            }}>
            {d === 'All' ? 'All Difficulty' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-8">
        {filtered.map(ex => {
          const result = results[ex.id];
          const isComplete = isClient && completed.has(ex.id);
          const hintLevel = showHint[ex.id] ?? -1;
          const solVisible = showSolution[ex.id];

          return (
            <div key={ex.id} className="rounded-xl border-2 overflow-hidden" style={{ borderColor: isComplete ? '#86efac' : '#e2e8f0' }}>
              {/* Header */}
              <div className="flex items-center gap-3 p-4" style={{ background: isComplete ? '#f0fdf4' : '#f8fafc' }}>
                {isComplete
                  ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />
                  : <span className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{ex.title}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: diffBg[ex.difficulty], color: diffColor[ex.difficulty] }}
                    >
                      {ex.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">{ex.topic}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 bg-white space-y-4">
                {/* Scenario */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Scenario</div>
                  <p className="text-sm text-slate-700">{ex.scenario}</p>
                </div>

                {/* Task */}
                <div className="p-3 rounded-lg" style={{ background: 'var(--color-snowflake-light)' }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-snowflake-dark)' }}>Your Task</div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-snowflake-dark)' }}>{ex.task}</p>
                </div>

                {/* Schema */}
                {ex.schema && (
                  <div className="text-xs text-slate-500 font-mono bg-slate-50 rounded p-2 whitespace-pre-line">{ex.schema}</div>
                )}

                {/* Code editor */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Your SQL</div>
                  <textarea
                    value={userCode[ex.id] ?? ''}
                    onChange={e => setUserCode(prev => ({ ...prev, [ex.id]: e.target.value }))}
                    placeholder="-- Write your SQL here..."
                    className="w-full font-mono text-sm border border-slate-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 bg-white"
                    style={{ minHeight: '120px', fontFamily: 'JetBrains Mono, Fira Code, monospace', focusRingColor: 'var(--color-snowflake-blue)' } as React.CSSProperties}
                    spellCheck={false}
                  />
                </div>

                {/* Result feedback */}
                {result && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: result === 'correct' ? '#f0fdf4' : '#fff7ed', color: result === 'correct' ? '#166534' : '#92400e' }}
                  >
                    {result === 'correct'
                      ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    }
                    <span>
                      {result === 'correct'
                        ? 'Correct! Well done — all required keywords are present.'
                        : 'Not quite. Check the hints or reveal the solution to see what\'s missing.'}
                    </span>
                  </div>
                )}

                {/* Hint */}
                {hintLevel >= 0 && hintLevel < ex.hints.length && (
                  <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: '#eff6ff', color: '#1e3a8a' }}>
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Hint {hintLevel + 1}:</strong> {ex.hints[hintLevel]}</span>
                  </div>
                )}

                {/* Solution */}
                {solVisible && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Model Solution</div>
                    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm overflow-x-auto">
                      <code>{ex.solution}</code>
                    </pre>
                    <div className="mt-2 p-3 rounded-lg text-sm" style={{ background: '#f0fdf4', color: '#166534' }}>
                      <strong>Explanation: </strong>{ex.explanation}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => checkAnswer(ex)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--color-snowflake-blue), var(--color-snowflake-sky))' }}
                  >
                    Check Answer
                  </button>
                  <button
                    onClick={() => setShowHint(prev => ({ ...prev, [ex.id]: Math.min((prev[ex.id] ?? -1) + 1, ex.hints.length - 1) }))}
                    disabled={hintLevel >= ex.hints.length - 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 flex items-center gap-1 disabled:opacity-40"
                    style={{ color: '#475569' }}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {hintLevel < 0 ? 'Show Hint' : hintLevel < ex.hints.length - 1 ? 'Next Hint' : 'No More Hints'}
                  </button>
                  <button
                    onClick={() => setShowSolution(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 flex items-center gap-1"
                    style={{ color: '#475569' }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    {solVisible ? 'Hide Solution' : 'Show Solution'}
                  </button>
                  <button
                    onClick={() => {
                      setUserCode(prev => ({ ...prev, [ex.id]: '' }));
                      setResults(prev => ({ ...prev, [ex.id]: null }));
                      setShowHint(prev => ({ ...prev, [ex.id]: -1 }));
                      setShowSolution(prev => ({ ...prev, [ex.id]: false }));
                    }}
                    className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
