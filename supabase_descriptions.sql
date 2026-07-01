-- Shared service descriptions table for all users
CREATE TABLE IF NOT EXISTS descriptions (
    id serial PRIMARY KEY,
    text text NOT NULL
);

-- Insert default descriptions (run only once)
INSERT INTO descriptions (text) VALUES
('US Federal Corporation Income Tax Return (Form 1120)'),
('US Partnership Income Tax Return (Form 1065)'),
('US Individual Income Tax Return (Form 1040)'),
('US S Corporation Income Tax Return (Form 1120-S)'),
('Foreign Related Party Disclosure (Form 5471)'),
('Foreign Related Party Disclosure (Form 5472)'),
('Application for Automatic Extension of Time To File (Form 7004)'),
('Bookkeeping Services'),
('Payroll Processing & Payroll Tax Filing'),
('Financial Statement Preparation'),
('Tax Planning & Advisory Services'),
('Accounting & Compliance Services'),
('GST Registration'),
('GST Return Filing'),
('GST Audit & Compliance'),
('Business Consulting Services'),
('Virtual CFO Services'),
('Company Incorporation & Registration'),
('Other Professional Services');
