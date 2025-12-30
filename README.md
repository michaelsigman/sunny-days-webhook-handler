# Sunny Days Webhook Handler

Receives Stripe Connect webhooks from PoolPilot and forwards normalized
payment events to Sunny Days Vacation Rentals.

## Events handled
- payment_intent.succeeded

## Deployment
Designed for Render (Node service).

## Environment Variables
See `.env.example`

## Health Check
GET /health

## Stripe Webhook Endpoint
POST /stripe/webhook
