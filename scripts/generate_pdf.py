import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "BariJao — Bangladesh E-Ticketing & P2P Resale Platform Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "Confidential & Proprietary — BariJao Engineering")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()

def create_guide_pdf(filename="BariJao_Redesign_and_Architecture_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#065f46")   # Deep Emerald
    accent_color = colors.HexColor("#0f766e")    # Teal
    dark_neutral = colors.HexColor("#0f172a")    # Slate 900
    body_color = colors.HexColor("#334155")      # Slate 700

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.white,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#ccfbf1"),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=dark_neutral,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=body_color,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=body_color,
        leftIndent=15,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#f8fafc"),
        backColor=colors.HexColor("#0f172a"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#065f46")
    )

    story = []

    # --- COVER BANNER TABLE ---
    banner_content = [
        [Paragraph("BARIJAO PLATFORM REDESIGN & RUNBOOK", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#a7f3d0')))],
        [Paragraph("Bangladesh E-Ticketing & P2P Resale Platform", title_style)],
        [Paragraph("Comprehensive system architecture, Shohoz & BDtickets style e-ticketing integration, P2P second-hand marketplace, and step-by-step web execution guide.", subtitle_style)],
        [Paragraph("<b>Version:</b> 2.0 (Dual Engine) &nbsp;|&nbsp; <b>Tech:</b> React 19, TypeScript, Express, SQLite &nbsp;|&nbsp; <b>Date:</b> November 2026", ParagraphStyle('Meta', fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#99f6e4')))]
    ]
    banner_table = Table(banner_content, colWidths=[504])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('PADDING', (0,0), (-1,-1), 16),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 16),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 14))

    # --- 1. EXECUTIVE SUMMARY ---
    story.append(Paragraph("1. Executive Summary & Core Platform Vision", h1_style))
    story.append(Paragraph(
        "<b>BariJao</b> was founded to address one of Bangladesh's most pressing consumer travel problems: dangerous black-market ticket scalping and rampant scams during Eid festival rushes. In version 2.0, BariJao evolves into a full-scale <b>multi-modal travel e-ticketing hub</b> inspired by industry leaders <b>Shohoz.com</b> and <b>bdtickets.com</b>, while preserving and elevating the signature <b>P2P Second-Hand Ticket Exchange</b> side-by-side.",
        body_style
    ))

    # Callout Box
    callout_data = [[
        Paragraph("<b>The Dual-Model Advantage:</b> Under regular travel circumstances, passengers buy official e-tickets directly from verified transport operators at official counter fares. When high-demand routes or festival tickets sell out, travelers switch to the built-in <b>P2P Resale Marketplace</b> to safely acquire or resell spare tickets without Facebook scam risks or extortionate markups.", callout_style)
    ]]
    callout_table = Table(callout_data, colWidths=[504])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINELEFT', (0,0), (-1,-1), 3.5, primary_color),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 10))

    # --- 2. KEY CAPABILITIES ---
    story.append(Paragraph("2. Comprehensive Feature Breakdown", h1_style))

    story.append(Paragraph("A. Official E-Ticketing System (Shohoz & BDtickets Style)", h2_style))
    story.append(Paragraph("• <b>Bus Ticketing:</b> Green Line Paribahan (Scania Multi-Axle AC), Hanif Enterprise, Shohagh Paribahan, Shyamoli NR Travels, Desh Travels, Saintmartin Paribahan (Royal Sleeper), London Express, and Ena Transport.", bullet_style))
    story.append(Paragraph("• <b>Train Ticketing:</b> Bangladesh Railway Intercity Express (Subarna Express 701, Sonar Bangla 787, Cox's Bazar Express 813, Parabat, Silk City) with <i>Snigdha AC Chair</i>, <i>Shovon Chair</i>, and <i>AC Berth</i> classes.", bullet_style))
    story.append(Paragraph("• <b>Launch / Waterways:</b> MV Manami, MV Parabat-12, MV Sundarban-16 with <i>Deluxe AC Cabins</i>, <i>VIP Suites</i>, and <i>Single Cabins</i> on Dhaka (Sadarghat) ⇄ Barishal, Bhola, and Chandpur.", bullet_style))
    story.append(Paragraph("• <b>Domestic Air:</b> Biman Bangladesh Airlines, US-Bangla Airlines, Air Astra, and Novoair connecting Dhaka to Cox's Bazar, Chattogram, Sylhet, and Saidpur.", bullet_style))
    story.append(Paragraph("• <b>Dynamic Route Fallback:</b> Automatically generates realistic matching operator departures for unlisted Bangladesh district pairs, ensuring no search turns up empty.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("B. Interactive Graphical Seat Map", h2_style))
    story.append(Paragraph("• <b>Authentic Vehicle Layouts:</b> Real 2×2 standard bus seating, 2×1 luxury business class, sleeper berths, train coach grids, and private launch cabin views with driver cabin & entrance indicators.", bullet_style))
    story.append(Paragraph("• <b>Seat States & Rules:</b> Available, Selected (Emerald), Booked (Gray), and Ladies-Only (Pink) with a 4-seat booking limit complying with Bangladesh travel standards.", bullet_style))
    story.append(Paragraph("• <b>Boarding & Dropping Points:</b> Accurate terminal counter selection (Sayedabad, Gabtoli, Kalyanpur, Dampara, Kolatoli, etc.) with departure/arrival timings.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("C. Checkout, Payment Simulator & Digital E-Tickets", h2_style))
    story.append(Paragraph("• <b>Bangladeshi Payments:</b> Interactive simulation for bKash (with Account number, demo OTP <code>123456</code>, and PIN verification), Nagad, Rocket, and Debit/Credit Cards.", bullet_style))
    story.append(Paragraph("• <b>Promo Discounts:</b> Working promo codes including <code>EID2026</code> (15% off up to ৳300), <code>BARIJAO50</code> (৳50 off), and <code>SHOHOZ10</code> (10% off).", bullet_style))
    story.append(Paragraph("• <b>Instant E-Ticket Voucher:</b> Automatically generates unique booking PNR (e.g. <code>BJ-BUS-485123</code>), QR code, barcode, trip details, and one-click printable voucher (<code>window.print()</code>).", bullet_style))
    story.append(Paragraph("• <b>PNR / Mobile Status Lookup:</b> Dedicated lookup at <code>/check-ticket</code> allows passengers to reprint and verify bookings anytime.", bullet_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("D. Preserved & Enhanced P2P Resale Marketplace", h2_style))
    story.append(Paragraph("• <b>Anti-Fraud Privacy:</b> Seat numbers, ticket copies, and seller phone numbers are shielded from logged-out users to eliminate counterfeit ticket duplication.", bullet_style))
    story.append(Paragraph("• <b>Private 1-on-1 Chat:</b> Dedicated buyer-seller chat threads for each ticket negotiation.", bullet_style))
    story.append(Paragraph("• <b>Verified Community:</b> Seller star ratings and reviews to build confidence.", bullet_style))
    story.append(Paragraph("• <b>Unified Dashboard:</b> Single portal to manage official e-ticket vouchers, listed resale tickets, and purchases.", bullet_style))

    story.append(PageBreak())

    # --- 3. TECHNICAL ARCHITECTURE ---
    story.append(Paragraph("3. Technical Architecture & Endpoints", h1_style))
    story.append(Paragraph(
        "BariJao uses a unified, full-stack TypeScript architecture built with React 19 on Vite and an Express.js backend backed by SQLite with Supabase PostgreSQL failover support.",
        body_style
    ))

    # Architecture Table
    arch_data = [
        [Paragraph("<b>Component</b>", body_style), Paragraph("<b>Technology</b>", body_style), Paragraph("<b>Key Responsibilities</b>", body_style)],
        [Paragraph("Frontend UI", body_style), Paragraph("React 19, Tailwind CSS v4, Lucide Icons, Vite", body_style), Paragraph("Hero search, interactive seat maps, modals, checkout flow, bilingual context.", body_style)],
        [Paragraph("Backend API", body_style), Paragraph("Node.js, Express, tsx runtime, JWT, Multer", body_style), Paragraph("Official ticketing endpoints, auth with rate-limited OTP, P2P chat, admin routes.", body_style)],
        [Paragraph("Database Engine", body_style), Paragraph("better-sqlite3 / Supabase Postgres", body_style), Paragraph("Tables: <code>official_trips</code>, <code>official_bookings</code>, <code>tickets</code>, <code>users</code>.", body_style)],
        [Paragraph("Ticketing Core", body_style), Paragraph("officialTicketService.ts", body_style), Paragraph("Schedule seeding, dynamic route generator, seat lock, PNR generation.", body_style)]
    ]
    arch_table = Table(arch_data, colWidths=[100, 160, 244])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Primary REST API Endpoints:", h2_style))
    api_code = (
        "GET    /api/official/trips?transport_type=bus&from=Dhaka&to=Cox's%20Bazar\n"
        "GET    /api/official/trips/:id             -> Fetch trip & live seat availability\n"
        "POST   /api/official/bookings              -> Confirm booking & generate PNR\n"
        "GET    /api/official/bookings/pnr/:pnr     -> Lookup e-ticket by PNR / Phone\n"
        "GET    /api/official/my-bookings           -> Retrieve authenticated user's e-tickets\n"
        "GET    /api/official/popular-routes        -> Top Bangladeshi destinations & fares\n"
        "GET    /api/tickets                        -> Community P2P resale listings\n"
        "POST   /api/tickets                        -> List a spare second-hand ticket\n"
        "POST   /api/messages                       -> 1-on-1 private buyer-seller chat"
    )
    story.append(Paragraph(api_code.replace('\n', '<br/>'), code_style))
    story.append(Spacer(1, 10))

    # --- 4. STEP-BY-STEP RUNBOOK ---
    story.append(Paragraph("4. Step-by-Step Runbook: How to Run the Web Application", h1_style))
    story.append(Paragraph("Follow these instructions to run, test, build, and deploy the BariJao web platform locally or in production:", body_style))

    story.append(Paragraph("Step 1: Prerequisites Check", h2_style))
    story.append(Paragraph("Ensure you have <b>Node.js</b> (v18.0.0 or higher, v20+ recommended) and <b>npm</b> installed:", body_style))
    story.append(Paragraph("node -v<br/>npm -v", code_style))

    story.append(Paragraph("Step 2: Install Project Dependencies", h2_style))
    story.append(Paragraph("Navigate to the project root directory and run:", body_style))
    story.append(Paragraph("cd D:\\barijao<br/>npm install", code_style))

    story.append(Paragraph("Step 3: Launch the Development Server", h2_style))
    story.append(Paragraph("To start both the Express backend API and the Vite frontend with Hot Module Replacement (HMR):", body_style))
    story.append(Paragraph("npm run dev", code_style))
    story.append(Paragraph("Once launched, open your browser and navigate to: <b><u>http://localhost:3000</u></b>", body_style))

    story.append(Paragraph("Step 4: Type Checking and Production Build", h2_style))
    story.append(Paragraph("To verify zero TypeScript errors and compile the production bundle:", body_style))
    story.append(Paragraph("npm run lint     # Compiles TypeScript with 0 errors<br/>npm run build    # Generates optimized static assets in /dist", code_style))

    story.append(Paragraph("Step 5: Production Execution", h2_style))
    story.append(Paragraph("To serve the compiled application in production mode:", body_style))
    story.append(Paragraph("npm start", code_style))

    story.append(Paragraph("Step 6: Quick Demo & Testing Credentials", h2_style))
    story.append(Paragraph("• <b>Test Route:</b> Search <i>Dhaka</i> to <i>Cox's Bazar</i> on Bus or <i>Dhaka</i> to <i>Chattogram</i> on Train.", bullet_style))
    story.append(Paragraph("• <b>Seat Map:</b> Click 'View Seats' on any operator card, select seats, and pick boarding points.", bullet_style))
    story.append(Paragraph("• <b>Discount Promo:</b> Apply promo code <code>EID2026</code> (15% off) or <code>BARIJAO50</code> (৳50 off).", bullet_style))
    story.append(Paragraph("• <b>bKash Simulator:</b> Enter any 11-digit number, use OTP <code>123456</code>, and any 5-digit PIN.", bullet_style))
    story.append(Paragraph("• <b>PNR Lookup:</b> Visit <code>/check-ticket</code> or use the navbar search to retrieve and print vouchers.", bullet_style))
    story.append(Paragraph("• <b>P2P Resale:</b> Visit <code>/resale</code> or click the 'Resale Market' tab to buy or sell spare tickets.", bullet_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF at: {filename}")

if __name__ == "__main__":
    output_path = os.path.join(os.path.dirname(__file__), "..", "BariJao_Platform_Redesign_Guide.pdf")
    create_guide_pdf(os.path.abspath(output_path))
