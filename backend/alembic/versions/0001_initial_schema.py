"""Initial Schema - Cloud Pilot Database Models

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-26 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Create cloud_accounts table
    op.create_table(
        'cloud_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.String(length=50), nullable=False),
        sa.Column('aws_account_id', sa.String(length=50), nullable=True),
        sa.Column('role_arn', sa.String(length=255), nullable=True),
        sa.Column('region', sa.String(length=50), nullable=True, server_default='ap-south-1'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('health_score', sa.Integer(), nullable=True, server_default='100'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_cloud_accounts_user_id'), 'cloud_accounts', ['user_id'], unique=False)

    # 3. Create resources table
    op.create_table(
        'resources',
        sa.Column('id', sa.String(length=100), primary_key=True),
        sa.Column('cloud_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cloud_accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('instance_type', sa.String(length=50), nullable=True),
        sa.Column('region', sa.String(length=50), nullable=False, server_default='ap-south-1'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='Running'),
        sa.Column('monthly_cost', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('risk', sa.String(length=20), nullable=False, server_default='Low'),
        sa.Column('public_access', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('storage_gb', sa.Float(), nullable=True),
        sa.Column('cpu_utilization', sa.Float(), nullable=True),
        sa.Column('memory_utilization', sa.Float(), nullable=True),
        sa.Column('invocations', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_resources_cloud_account_id'), 'resources', ['cloud_account_id'], unique=False)
    op.create_index(op.f('ix_resources_type'), 'resources', ['type'], unique=False)

    # 4. Create cost_records table
    op.create_table(
        'cost_records',
        sa.Column('id', sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column('cloud_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cloud_accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('service_name', sa.String(length=50), nullable=False),
        sa.Column('period_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_cost_records_cloud_account_id'), 'cost_records', ['cloud_account_id'], unique=False)
    op.create_index(op.f('ix_cost_records_service_name'), 'cost_records', ['service_name'], unique=False)
    op.create_index(op.f('ix_cost_records_period_date'), 'cost_records', ['period_date'], unique=False)

    # 5. Create security_findings table
    op.create_table(
        'security_findings',
        sa.Column('id', sa.String(length=50), primary_key=True),
        sa.Column('cloud_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cloud_accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('resource', sa.String(length=255), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('recommendation', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='Active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_security_findings_cloud_account_id'), 'security_findings', ['cloud_account_id'], unique=False)
    op.create_index(op.f('ix_security_findings_severity'), 'security_findings', ['severity'], unique=False)

    # 6. Create recommendations table
    op.create_table(
        'recommendations',
        sa.Column('id', sa.String(length=50), primary_key=True),
        sa.Column('cloud_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cloud_accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('resource', sa.String(length=255), nullable=False),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('estimated_savings', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index(op.f('ix_recommendations_cloud_account_id'), 'recommendations', ['cloud_account_id'], unique=False)
    op.create_index(op.f('ix_recommendations_priority'), 'recommendations', ['priority'], unique=False)

    # 7. Create scan_jobs table
    op.create_table(
        'scan_jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('cloud_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('cloud_accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_step', sa.String(length=255), nullable=False, server_default='Initializing cloud scan'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_scan_jobs_cloud_account_id'), 'scan_jobs', ['cloud_account_id'], unique=False)


def downgrade() -> None:
    op.drop_table('scan_jobs')
    op.drop_table('recommendations')
    op.drop_table('security_findings')
    op.drop_table('cost_records')
    op.drop_table('resources')
    op.drop_table('cloud_accounts')
    op.drop_table('users')
