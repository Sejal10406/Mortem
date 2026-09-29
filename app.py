"""
MORTEM: The Unnecessarily Serious Object Lifespan Predictor ☠️
Flask Web Application & Rule-Based Forensic Prediction Engine.
"""

import os
import json
import random
import datetime
from flask import Flask, render_template, request, redirect, url_for, jsonify, abort

app = Flask(__name__)
app.config['SECRET_KEY'] = 'mortem-scientific-forensic-secret-key-2026'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OBJECTS_FILE = os.path.join(DATA_DIR, 'objects.json')
CAUSES_FILE = os.path.join(DATA_DIR, 'causes.json')
PREDICTIONS_FILE = os.path.join(DATA_DIR, 'predictions.json')


def ensure_data_files():
    """Ensure data directory and required JSON files exist."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(PREDICTIONS_FILE):
        with open(PREDICTIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, indent=2)


def load_json(filepath, default_val=None):
    """Safely load JSON data with fallback."""
    if default_val is None:
        default_val = {}
    if not os.path.exists(filepath):
        return default_val
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return default_val


def save_json(filepath, data):
    """Safely write JSON data with atomic guarantee."""
    temp_file = f"{filepath}.tmp"
    try:
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.replace(temp_file, filepath)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except OSError:
                pass
        return False


def load_objects():
    return load_json(OBJECTS_FILE, {})


def load_causes():
    return load_json(CAUSES_FILE, {})


def load_predictions():
    ensure_data_files()
    preds = load_json(PREDICTIONS_FILE, [])
    if not isinstance(preds, list):
        return []
    return preds


def save_prediction(prediction_data):
    preds = load_predictions()
    preds.insert(0, prediction_data)  # Prepend newest
    save_json(PREDICTIONS_FILE, preds)


def generate_case_number():
    """Generate a clean 5-digit case identifier."""
    preds = load_predictions()
    if preds:
        last_case = preds[0].get('case_id', '00400')
        digits = ''.join(filter(str.isdigit, str(last_case)))
        if digits:
            next_num = int(digits) + random.randint(1, 4)
            return f"{next_num:05d}"
    return f"{random.randint(10000, 99999):05d}"


def calculate_multipliers(usage, condition, care):
    """Compute multipliers based on empirical forensic criteria."""
    # Usage Multiplier
    usage_map = {
        'Light': 1.25,
        'Moderate': 1.00,
        'Heavy': 0.70,
        'Extreme': 0.45
    }
    usage_mult = usage_map.get(usage, 1.00)

    # Condition Multiplier (0-100)
    cond = max(0, min(100, int(condition)))
    if cond >= 90:
        cond_mult = 1.20
    elif cond >= 70:
        cond_mult = 1.00
    elif cond >= 40:
        cond_mult = 0.75
    elif cond >= 20:
        cond_mult = 0.50
    else:
        cond_mult = 0.25

    # Care Multiplier
    care_norm = care.strip().lower()
    if 'excellent' in care_norm:
        care_mult = 1.20
    elif 'good' in care_norm:
        care_mult = 1.05
    elif 'questionable' in care_norm:
        care_mult = 0.85
    elif 'negligent' in care_norm:
        care_mult = 0.60
    elif 'forgot' in care_norm or 'forgotten' in care_norm:
        care_mult = 0.40
    else:
        care_mult = 0.85

    return usage_mult, cond_mult, care_mult


def calculate_lifespan(base_days, usage, condition, care):
    """
    Calculate estimated lifespan with controlled randomness.
    estimated_lifespan = base_lifespan × usage_multiplier × condition_multiplier × care_multiplier
    """
    u_mult, c_mult, car_mult = calculate_multipliers(usage, condition, care)
    raw_estimate = base_days * u_mult * c_mult * car_mult

    # Small controlled random variation (±8%)
    variation = random.uniform(0.92, 1.08)
    final_days = max(1.0, round(raw_estimate * variation, 2))
    return final_days, u_mult, c_mult, car_mult


def calculate_survival_probability(condition, u_mult, car_mult, remaining_days, base_days):
    """Generate dynamic survival percentage based on physical metrics."""
    cond = max(0, min(100, int(condition)))
    ratio = remaining_days / max(1.0, base_days)

    # Composite weighted survival score
    raw_prob = (cond * 0.45) + (min(1.2, ratio) * 100 * 0.35) + (u_mult * 10) + (car_mult * 10)
    jitter = random.uniform(-2, 2)
    final_prob = max(1, min(99, int(round(raw_prob + jitter))))
    return final_prob


def calculate_risk(survival_prob):
    """
    Risk Classification based on Survival Probability:
    1. SAFE: > 60%
    2. AT RISK: 30% - 60%
    3. CRITICAL: 15% - 30%
    4. TERMINAL: < 15%
    """
    if survival_prob > 60:
        return (
            "SAFE",
            "🟢 SAFE",
            "OBJECT HEALTH REPORT",
            "Your object is doing surprisingly well.",
            "Continue normal usage. No immediate intervention required."
        )
    elif survival_prob >= 30:
        return (
            "AT RISK",
            "🟡 AT RISK",
            "EARLY WARNING REPORT",
            "The object has shown signs of decline. Nothing dramatic... yet.",
            "Reduce excessive usage and consider keeping a replacement nearby."
        )
    elif survival_prob >= 15:
        return (
            "CRITICAL",
            "🟠 CRITICAL",
            "FINAL WARNING",
            "The decline is accelerating.",
            "Replacement is strongly recommended before the inevitable occurs."
        )
    else:
        return (
            "TERMINAL",
            "🔴 TERMINAL",
            "TERMINAL WARNING",
            "The object has entered its final chapter.",
            "Replacement is strongly recommended before the inevitable occurs."
        )


def declare_case_deceased(case, explicit_time=None):
    """Transition an object into official DEAD state with DEATH_CERTIFICATE report type."""
    now = explicit_time or datetime.datetime.now()
    case['life_status'] = 'DEAD'
    case['report_type'] = 'DEATH_CERTIFICATE'
    case['status'] = 'DECEASED'
    case['state'] = 'DEAD'
    case['is_deceased'] = True
    case['remaining_days'] = 0.0
    case['remaining_formatted'] = '00:00 (EXPIRED)'
    case['death_time'] = now.strftime('%d %B %Y, %I:%M %p')
    case['date_of_death'] = now.strftime('%d %B %Y')
    case['time_of_death'] = now.strftime('%I:%M %p')
    case['final_survival_probability'] = 0
    case['final_risk_level'] = 'DECEASED'
    case['report_title'] = 'DEATH CERTIFICATE'
    case['risk_desc'] = 'Official declaration of cessation of object utility.'
    case['recommended_action'] = 'Official death certificate is available for generation and printing.'
    case['status_badge'] = '☠️ DECEASED'
    case['can_generate_certificate'] = True
    case['officially_declared'] = 'UNNECESSARILY DECEASED'
    return case


def check_and_update_deceased(case):
    """Verify if object has reached end of life (remaining_life <= 0) and transition to DEAD."""
    if not case:
        return case
    
    if case.get('life_status') == 'DEAD' or case.get('status') == 'DECEASED' or case.get('is_deceased'):
        case['life_status'] = 'DEAD'
        case['report_type'] = 'DEATH_CERTIFICATE'
        case['status'] = 'DECEASED'
        case['state'] = 'DEAD'
        case['is_deceased'] = True
        case['can_generate_certificate'] = True
        return case

    death_epoch = case.get('death_timestamp_epoch')
    now_epoch = datetime.datetime.now().timestamp()
    remaining_days = case.get('remaining_days', 1.0)

    # STRICT CORE RULE: ONLY when remaining_life <= 0 does life_status become DEAD
    if (death_epoch and now_epoch >= death_epoch) or remaining_days <= 0:
        declare_case_deceased(case)
        # Persist updated state to predictions file
        preds = load_predictions()
        for idx, p in enumerate(preds):
            if str(p.get('case_id')) == str(case.get('case_id')):
                preds[idx] = case
                break
        save_json(PREDICTIONS_FILE, preds)
    else:
        case['life_status'] = 'ALIVE'
        case['report_type'] = 'HEALTH_REPORT'
        case['can_generate_certificate'] = False

    return case


def format_lifespan(total_days):
    """Convert float days into clinical human-readable string."""
    days = int(total_days)
    hours = int(round((total_days - days) * 24))

    if total_days >= 365:
        years = int(total_days // 365)
        rem_months = int((total_days % 365) // 30)
        if rem_months > 0:
            return f"{years} Year{'s' if years > 1 else ''}, {rem_months} Month{'s' if rem_months > 1 else ''}"
        return f"{years} Year{'s' if years > 1 else ''}"
    elif total_days >= 60:
        months = int(total_days // 30)
        rem_days = int(total_days % 30)
        if rem_days > 0:
            return f"{months} Months, {rem_days} Days"
        return f"{months} Months"
    elif total_days >= 7:
        weeks = int(total_days // 7)
        rem_days = int(total_days % 7)
        if rem_days > 0:
            return f"{weeks} Week{'s' if weeks > 1 else ''}, {rem_days} Day{'s' if rem_days > 1 else ''}"
        return f"{weeks} Week{'s' if weeks > 1 else ''}"
    elif days > 0:
        if hours > 0:
            return f"{days} Day{'s' if days > 1 else ''}, {hours} Hour{'s' if hours > 1 else ''}"
        return f"{days} Day{'s' if days > 1 else ''}"
    else:
        return f"{max(1, hours)} Hour{'s' if hours > 1 else ''}"


def generate_cause_of_death(object_key, usage, condition, care, object_info, causes_catalog):
    """Select humorous, object-tailored cause of death."""
    obj_causes = []

    # 1. Object specific causes from causes.json
    by_object = causes_catalog.get('by_object', {})
    if object_key in by_object and by_object[object_key]:
        obj_causes.extend(by_object[object_key])

    # 2. Causes defined in objects.json
    if object_info and 'causes' in object_info:
        obj_causes.extend(object_info['causes'])

    # 3. Condition or care specific causes if applicable
    cond = int(condition)
    if cond < 20:
        obj_causes.extend(causes_catalog.get('by_condition', {}).get('destroyed', []))
    elif cond < 40:
        obj_causes.extend(causes_catalog.get('by_condition', {}).get('poor', []))

    if 'negligent' in care.lower():
        obj_causes.extend(causes_catalog.get('by_care', {}).get('negligent', []))
    elif 'forgot' in care.lower():
        obj_causes.extend(causes_catalog.get('by_care', {}).get('forgotten', []))

    # Fallback to general causes
    if not obj_causes:
        obj_causes = causes_catalog.get('general', [
            "Sudden catastrophic failure during the exact moment it was needed most."
        ])

    return random.choice(obj_causes)


def compute_stats(predictions):
    """Calculate dynamic dashboard statistics."""
    total = len(predictions)
    if total == 0:
        return {
            'total_analyzed': 0,
            'safe_objects': 0,
            'at_risk_objects': 0,
            'critical_cases': 0,
            'terminal_cases': 0,
            'average_survival': 0,
            'most_analyzed': 'None'
        }

    safe_count = sum(1 for p in predictions if p.get('risk') == 'SAFE')
    at_risk_count = sum(1 for p in predictions if p.get('risk') == 'AT RISK')
    critical_count = sum(1 for p in predictions if p.get('risk') == 'CRITICAL')
    terminal_count = sum(1 for p in predictions if p.get('risk') == 'TERMINAL')
    avg_survival = int(round(sum(p.get('survival_probability', 50) for p in predictions) / total))

    # Find most common object
    counts = {}
    for p in predictions:
        name = p.get('object_name', 'Unknown')
        counts[name] = counts.get(name, 0) + 1
    most_analyzed = max(counts.items(), key=lambda x: x[1])[0] if counts else 'None'

    return {
        'total_analyzed': total,
        'safe_objects': safe_count,
        'at_risk_objects': at_risk_count,
        'critical_cases': critical_count,
        'terminal_cases': terminal_count,
        'average_survival': avg_survival,
        'most_analyzed': most_analyzed
    }


# =========================================================================
# FLASK ROUTES
# =========================================================================

@app.route('/')
def home():
    """Dashboard / Home Page."""
    predictions = load_predictions()
    stats = compute_stats(predictions)
    recent_cases = predictions[:4]
    objects_data = load_objects()
    return render_template(
        'index.html',
        stats=stats,
        recent_cases=recent_cases,
        objects=objects_data
    )


@app.route('/predict', methods=['GET', 'POST'])
def predict():
    """Object Autopsy & Lifespan Prediction Form."""
    objects_data = load_objects()
    causes_data = load_causes()

    if request.method == 'GET':
        return render_template('index.html', scroll_to='predict', objects=objects_data)

    # POST processing
    object_key = request.form.get('object_type', 'pencil').strip().lower()
    custom_name = request.form.get('custom_name', '').strip()
    usage = request.form.get('usage', 'Moderate')
    condition_raw = request.form.get('condition', 50)
    care = request.form.get('care', 'Good')
    notes = request.form.get('notes', '').strip()

    try:
        condition = int(condition_raw)
    except ValueError:
        condition = 50

    if object_key == 'custom' and custom_name:
        object_name = custom_name
        base_days = 180
        icon = "☠️"
        action = "Treat with utmost caution; scientific baseline is uncharted."
        obj_info = {"causes": []}
    elif object_key in objects_data:
        obj_info = objects_data[object_key]
        object_name = obj_info.get('name', object_key.capitalize())
        base_days = obj_info.get('base_lifespan_days', 100)
        icon = obj_info.get('icon', '📦')
        action = obj_info.get('recommended_action', 'Handle with standard caution.')
    else:
        obj_info = {"causes": []}
        object_name = object_key.capitalize()
        base_days = 120
        icon = "📦"
        action = "Continuous surveillance recommended."

    # Calculation Engine
    remaining_days, u_mult, c_mult, car_mult = calculate_lifespan(base_days, usage, condition, care)
    survival_prob = calculate_survival_probability(condition, u_mult, car_mult, remaining_days, base_days)
    risk, status_badge, report_title, risk_desc, recommendation = calculate_risk(survival_prob)
    cause_of_death = generate_cause_of_death(object_key, usage, condition, care, obj_info, causes_data)
    case_id = generate_case_number()

    now = datetime.datetime.now()
    now_epoch = now.timestamp()
    demo_mode = request.form.get('demo_mode') in ['on', 'true', '1', True]

    if demo_mode:
        # Hackathon Demo Mode: short live countdown (default 150 seconds = 02:30)
        try:
            demo_seconds = int(request.form.get('demo_seconds', 150))
        except (ValueError, TypeError):
            demo_seconds = 150
        remaining_days = round(demo_seconds / 86400.0, 6)
        remaining_formatted = "2 Minutes, 30 Seconds"
        death_timestamp_epoch = now_epoch + demo_seconds
        death_date = now + datetime.timedelta(seconds=demo_seconds)
    else:
        demo_seconds = 0
        death_timestamp_epoch = now_epoch + (remaining_days * 86400.0)
        remaining_formatted = format_lifespan(remaining_days)
        death_date = now + datetime.timedelta(days=remaining_days)

    last_words = obj_info.get('last_known_words', '“I did my best in an uncaring universe.”')
    margin_note = obj_info.get('margin_note', 'Another victim of standard entropy... ☹')
    closing_doodle = obj_info.get('closing_doodle', 'Short life. Big dreams.')
    forensic_notes = obj_info.get('forensic_notes', [
        f"Showed unmistakable signs of wear and tear from {usage.lower()} usage.",
        f"{care} owner custody contributed directly to accelerated decline.",
        f"Operating integrity degraded to {condition}% before intervention.",
        "Final moments were brief, tragic, and unceremonious."
    ])

    # IMPORTANT LOGIC (Requirement 1, 2, 3, 4):
    # Two final report types:
    # remaining_life > 0 => life_status = "ALIVE", report_type = "HEALTH_REPORT"
    # remaining_life <= 0 => life_status = "DEAD", report_type = "DEATH_CERTIFICATE"
    if remaining_days > 0:
        life_status = "ALIVE"
        report_type = "HEALTH_REPORT"
        status = "ALIVE"
        is_deceased = False
        can_generate_certificate = False
        report_title = "OBJECT HEALTH REPORT"
    else:
        life_status = "DEAD"
        report_type = "DEATH_CERTIFICATE"
        status = "DECEASED"
        is_deceased = True
        can_generate_certificate = True
        report_title = "DEATH CERTIFICATE"

    prediction = {
        'case_id': case_id,
        'mrt_case_id': f"MRT-{case_id}",
        'timestamp': now.strftime('%Y-%m-%d %H:%M:%S'),
        'date_of_prediction': now.strftime('%d %b %Y'),
        'object_key': object_key,
        'object_name': object_name,
        'icon': icon,
        'usage': usage,
        'condition': condition,
        'health_score': condition,
        'care': care,
        'notes': notes if notes else "Subject admitted without additional sworn affidavits.",
        'remaining_days': remaining_days,
        'remaining_formatted': remaining_formatted,
        'survival_probability': survival_prob,
        'risk': risk,
        'status': status,
        'state': life_status,
        'life_status': life_status,
        'report_type': report_type,
        'is_deceased': is_deceased,
        'status_badge': "● ALIVE" if life_status == "ALIVE" else "☠️ DECEASED",
        'report_title': report_title,
        'risk_desc': risk_desc,
        'cause_of_death': cause_of_death,
        'last_known_words': last_words,
        'margin_note': margin_note,
        'closing_doodle': closing_doodle,
        'forensic_notes': forensic_notes,
        'estimated_death_date': death_date.strftime('%d %b %Y, %H:%M'),
        'recommended_action': recommendation,
        'can_generate_certificate': can_generate_certificate,
        'demo_mode': demo_mode,
        'demo_duration_seconds': demo_seconds,
        'death_timestamp_epoch': death_timestamp_epoch,
        'created_at_epoch': now_epoch,
        'officially_declared': "UNNECESSARILY DECEASED"
    }

    save_prediction(prediction)
    return redirect(url_for('result', case_id=case_id))


@app.route('/result/<case_id>')
def result(case_id):
    """Official Forensic Report (OBJECT HEALTH REPORT if ALIVE, DEATH CERTIFICATE if DEAD)."""
    predictions = load_predictions()
    match = next((p for p in predictions if str(p.get('case_id')) == str(case_id)), None)

    if not match:
        abort(404)

    # Backend verification: Check if lifespan expired and transition to DEAD
    match = check_and_update_deceased(match)

    error_msg = request.args.get('error')
    return render_template('result.html', case=match, error_msg=error_msg)


@app.route('/certificate/<case_id>')
def certificate(case_id):
    """Official Death Certificate (Protected route with strict access control)."""
    predictions = load_predictions()
    match = next((p for p in predictions if str(p.get('case_id')) == str(case_id)), None)

    if not match:
        abort(404)

    # Check and update if object expired
    match = check_and_update_deceased(match)

    # Strict access control (Requirement 9):
    # If life_status != "DEAD", then /certificate/<case_id> must NOT generate a certificate.
    if match.get('life_status') != 'DEAD':
        return render_template('certificate_unavailable.html', case=match), 403

    return render_template('certificate.html', case=match)


@app.route('/api/declare-death/<case_id>', methods=['POST', 'GET'])
@app.route('/declare-death/<case_id>', methods=['POST', 'GET'])
def api_declare_death(case_id):
    """Declare an object officially deceased when lifespan reaches 0."""
    preds = load_predictions()
    match_idx = next((i for i, p in enumerate(preds) if str(p.get('case_id')) == str(case_id)), None)

    if match_idx is None:
        return jsonify({'error': 'Case file not found'}), 404

    case = preds[match_idx]
    declare_case_deceased(case)
    preds[match_idx] = case
    save_json(PREDICTIONS_FILE, preds)

    if request.method == 'GET' and not request.headers.get('Accept', '').startswith('application/json'):
        return redirect(url_for('result', case_id=case_id))

    return jsonify({
        'success': True,
        'status': 'DECEASED',
        'message': f"Subject {case.get('object_name')} officially declared DECEASED.",
        'case': case
    })


@app.route('/history')
def history():
    """Case Archives & Past Predictions."""
    predictions = load_predictions()
    stats = compute_stats(predictions)
    return render_template('history.html', predictions=predictions, stats=stats)


@app.route('/history/clear', methods=['POST'])
def clear_history():
    """Clear all stored prediction history."""
    save_json(PREDICTIONS_FILE, [])
    return redirect(url_for('history'))


@app.route('/about')
def about():
    """About MORTEM Forensic Division."""
    return render_template('about.html')


@app.route('/api/stats')
def api_stats():
    """JSON API endpoint for dashboard telemetry."""
    preds = load_predictions()
    return jsonify(compute_stats(preds))


@app.route('/api/objects')
def api_objects():
    """JSON API endpoint returning all registered objects."""
    return jsonify(load_objects())


@app.errorhandler(404)
def page_not_found(e):
    return render_template('about.html', error_msg="Case file not found in MORTEM federal registry."), 404


@app.errorhandler(500)
def internal_server_error(e):
    return render_template('about.html', error_msg="Forensic telemetry error encountered."), 500


# if __name__ == '__main__':
#     ensure_data_files()
#     port = int(os.environ.get('PORT', 5000))
#     print(f"☠️ MORTEM Forensic Object Division active on http://127.0.0.1:{port}")
#     app.run(host='127.0.0.1', port=port, debug=True)

if __name__ == '__main__':
    ensure_data_files()
    port = int(os.environ.get('PORT', 5000))
    print(f"☠️ MORTEM Forensic Object Division active on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
