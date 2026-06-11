import Inquiry from '../models/Inquiry.js';
import ExcelJS from 'exceljs';

/**
 * @desc    Process chatbot message, match FAQs, or run stateful lead capturing flow
 * @route   POST /api/chatbot/message
 * @access  Public
 */
export const handleChatMessage = async (req, res) => {
  try {
    const { message, leadState = 'none', leadData = {} } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const cleanMsg = message.trim();
    const cleanMsgLower = cleanMsg.toLowerCase();

    // 1. STATEFUL LEAD GENERATION FLOW
    if (leadState && leadState !== 'none') {
      const updatedLeadData = { ...leadData };

      // State: capturing customer name
      if (leadState === 'awaiting_name') {
        updatedLeadData.customerName = cleanMsg;
        
        return res.json({
          reply: `Thank you, ${cleanMsg}! Please provide your mobile number so our sales team can assist you.`,
          nextLeadState: 'awaiting_phone',
          leadData: updatedLeadData,
          inquirySaved: false,
        });
      }

      // State: capturing mobile number
      if (leadState === 'awaiting_phone') {
        const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
        if (!phoneRegex.test(cleanMsg.replace(/\s+/g, ''))) {
          return res.json({
            reply: 'Please provide a valid mobile number (at least 10 digits).',
            nextLeadState: 'awaiting_phone',
            leadData: updatedLeadData,
            inquirySaved: false,
          });
        }
        updatedLeadData.phoneNumber = cleanMsg;

        // If product interest was not pre-captured, ask for it
        if (!updatedLeadData.interestedProduct) {
          return res.json({
            reply: 'Which product or gear are you interested in purchasing?',
            nextLeadState: 'awaiting_product',
            leadData: updatedLeadData,
            inquirySaved: false,
          });
        } else {
          return res.json({
            reply: `Got it! What is your budget for the ${updatedLeadData.interestedProduct}? (optional, type 'skip' if you don't have one)`,
            nextLeadState: 'awaiting_budget',
            leadData: updatedLeadData,
            inquirySaved: false,
          });
        }
      }

      // State: capturing interested product
      if (leadState === 'awaiting_product') {
        updatedLeadData.interestedProduct = cleanMsg;
        return res.json({
          reply: `Got it! What is your budget for the ${cleanMsg}? (optional, type 'skip' if you don't have one)`,
          nextLeadState: 'awaiting_budget',
          leadData: updatedLeadData,
          inquirySaved: false,
        });
      }

      // State: capturing budget (optional)
      if (leadState === 'awaiting_budget') {
        const isSkip = ['skip', 'no', 'none', 'n/a', 'not now'].includes(cleanMsgLower);
        updatedLeadData.budget = isSkip ? 'N/A' : cleanMsg;

        // Persist Inquiry into Database
        const inquiry = await Inquiry.create({
          customerName: updatedLeadData.customerName,
          phoneNumber: updatedLeadData.phoneNumber,
          interestedProduct: updatedLeadData.interestedProduct,
          budget: updatedLeadData.budget,
          inquiryMessage: `Sales Inquiry for ${updatedLeadData.interestedProduct}. Budget: ${updatedLeadData.budget}. Capture source: AI Support Assistant.`,
          status: 'New',
        });

        return res.json({
          reply: `Excellent! Your inquiry for the ${updatedLeadData.interestedProduct} has been submitted. Our sales team will contact you shortly on ${updatedLeadData.phoneNumber}. Have a great day!`,
          nextLeadState: 'none',
          leadData: {},
          inquirySaved: true,
        });
      }
    }

    // 2. DETECT BUYING INTENT TO INITIATE LEAD GENERATION
    const buyKeywords = ['buy', 'purchase', 'order', 'want to get', 'need a', 'interested in', 'price of', 'how much is'];
    const hasBuyIntent = buyKeywords.some(kw => cleanMsgLower.includes(kw));

    if (hasBuyIntent) {
      // Extract product keyword if possible
      let detectedProduct = '';
      if (cleanMsgLower.includes('bat')) {
        detectedProduct = 'Cricket Bat';
      } else if (cleanMsgLower.includes('glove')) {
        detectedProduct = 'Gloves';
      } else if (cleanMsgLower.includes('ball')) {
        detectedProduct = 'Cricket Ball';
      } else if (cleanMsgLower.includes('sleeves')) {
        detectedProduct = 'Sleeves';
      } else if (cleanMsgLower.includes('shaker')) {
        detectedProduct = 'Shaker';
      }

      return res.json({
        reply: 'Great! Please provide your name so our sales team can assist you.',
        nextLeadState: 'awaiting_name',
        leadData: {
          interestedProduct: detectedProduct,
        },
        inquirySaved: false,
      });
    }

    // 3. RESOLVE FAQ MATCHING
    // FAQ: Shop Location
    if (
      cleanMsgLower.includes('where') ||
      cleanMsgLower.includes('location') ||
      cleanMsgLower.includes('address') ||
      cleanMsgLower.includes('shop') ||
      cleanMsgLower.includes('store') ||
      cleanMsgLower.includes('situated') ||
      cleanMsgLower.includes('located')
    ) {
      return res.json({
        reply: 'K.S. Sports is located in Karnal, Haryana, India. We are open daily, offering a premium selection of cricket and athletic equipment. Come visit our storefront!',
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Contact details
    if (
      cleanMsgLower.includes('contact') ||
      cleanMsgLower.includes('number') ||
      cleanMsgLower.includes('phone') ||
      cleanMsgLower.includes('call') ||
      cleanMsgLower.includes('email') ||
      cleanMsgLower.includes('support') ||
      cleanMsgLower.includes('reach') ||
      cleanMsgLower.includes('whatsapp')
    ) {
      return res.json({
        reply: "You can reach K.S. Sports via phone or WhatsApp at +91 70822 52531, or email us at support@kssports.com. We'll be happy to assist you directly!",
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Return Policy
    if (
      cleanMsgLower.includes('return') ||
      cleanMsgLower.includes('refund') ||
      cleanMsgLower.includes('exchange') ||
      cleanMsgLower.includes('policy') ||
      cleanMsgLower.includes('replace')
    ) {
      return res.json({
        reply: 'We offer a 7-day return and exchange policy on all unused items. Products must be in their original packaging with tags intact. Please contact support to initiate a return request.',
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Order process
    if (
      cleanMsgLower.includes('how to order') ||
      cleanMsgLower.includes('how to buy') ||
      cleanMsgLower.includes('place order') ||
      cleanMsgLower.includes('order online') ||
      cleanMsgLower.includes('checkout')
    ) {
      return res.json({
        reply: 'Placing an order is simple:\n1. Browse sports gear on our [Shop Page](/shop)\n2. Add your products to the cart\n3. Click Checkout, enter your delivery address, and pay via credit/debit card, UPI, or cash on delivery (COD).',
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Do you have cricket bats?
    if (
      cleanMsgLower.includes('bats') ||
      cleanMsgLower.includes('cricket bat') ||
      cleanMsgLower.includes('willow') ||
      cleanMsgLower.includes('have bats')
    ) {
      return res.json({
        reply: 'Yes! We carry a wide selection of premium Kashmir Willow and English Willow cricket bats from top brands like KC, Veer, GTC, Sai, and KS. Check them out directly in our [Bats Section](/shop?category=Bat).',
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Best bat for beginners
    if (
      cleanMsgLower.includes('beginner') ||
      cleanMsgLower.includes('which bat is best') ||
      cleanMsgLower.includes('new player') ||
      cleanMsgLower.includes('best bat for')
    ) {
      return res.json({
        reply: 'For beginners, we highly recommend our premium Kashmir Willow bats or the GTC Regular Scope Bat. They are lightweight, budget-friendly, and provide excellent sweet spots to make learning control and shot execution easy!',
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Deliver across India
    if (
      cleanMsgLower.includes('deliver') ||
      cleanMsgLower.includes('ship') ||
      cleanMsgLower.includes('shipping') ||
      cleanMsgLower.includes('india') ||
      cleanMsgLower.includes('courier')
    ) {
      return res.json({
        reply: 'Yes, we provide express shipping and deliver premium sports equipment all across India. Packages are dispatched within 24-48 hours and arrive in 3-7 business days.',
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // FAQ: Greetings
    if (
      cleanMsgLower === 'hi' ||
      cleanMsgLower === 'hello' ||
      cleanMsgLower === 'hey' ||
      cleanMsgLower.includes('greetings') ||
      cleanMsgLower.includes('anyone there')
    ) {
      return res.json({
        reply: "Hello! Welcome to the K.S. Sports AI Assistant. How can I help you today? You can ask about our location, return policies, shipping, cricket bat recommendations, or ask to buy a product!",
        nextLeadState: 'none',
        leadData: {},
      });
    }

    // Fallback response
    return res.json({
      reply: "I am K.S. Sports' automated AI assistant. I can answer questions about location, contact details, cricket bats, delivery, and return policies. If you are interested in purchasing gear, simply say 'I want to buy a cricket bat' and I will log your sales inquiry!",
      nextLeadState: 'none',
      leadData: {},
    });

  } catch (error) {
    res.status(500).json({ message: error.message || 'Chatbot messaging failed' });
  }
};

/**
 * @desc    Get all lead inquiries with search & filter
 * @route   GET /api/chatbot/inquiries
 * @access  Private/Seller
 */
export const getInquiries = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status && status !== '') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { interestedProduct: searchRegex },
        { inquiryMessage: searchRegex },
      ];
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch inquiries' });
  }
};

/**
 * @desc    Update status of a customer inquiry
 * @route   PUT /api/chatbot/inquiries/:id
 * @access  Private/Seller
 */
export const updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Contacted', 'Converted', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid inquiry status' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    inquiry.status = status;
    const updatedInquiry = await inquiry.save();
    res.json(updatedInquiry);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update inquiry status' });
  }
};

/**
 * @desc    Delete a customer inquiry
 * @route   DELETE /api/chatbot/inquiries/:id
 * @access  Private/Seller
 */
export const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    await inquiry.deleteOne();
    res.json({ message: 'Inquiry removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete inquiry' });
  }
};

/**
 * @desc    Export inquiries list to Excel spreadsheet
 * @route   GET /api/chatbot/inquiries/export
 * @access  Private/Seller
 */
export const exportInquiries = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status && status !== '') {
      query.status = status;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { phoneNumber: searchRegex },
        { interestedProduct: searchRegex },
        { inquiryMessage: searchRegex },
      ];
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('AI Support Inquiries');

    worksheet.columns = [
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Mobile Number', key: 'phoneNumber', width: 18 },
      { header: 'Product Interest', key: 'interestedProduct', width: 22 },
      { header: 'Budget', key: 'budget', width: 14 },
      { header: 'Inquiry Message', key: 'inquiryMessage', width: 45 },
      { header: 'Date Captured', key: 'date', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    inquiries.forEach((inq) => {
      worksheet.addRow({
        customerName: inq.customerName || '-',
        phoneNumber: inq.phoneNumber || '-',
        interestedProduct: inq.interestedProduct || '-',
        budget: inq.budget || 'N/A',
        inquiryMessage: inq.inquiryMessage || '-',
        date: new Date(inq.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: inq.status || 'New',
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB91C1C' }, // Crimson theme matching K.S. Sports branding
    };
    headerRow.border = {
      bottom: { style: 'medium', color: { argb: '33FFFFFF' } },
    };

    worksheet.eachRow((row, rowNumber) => {
      row.alignment = { vertical: 'middle' };
      if (rowNumber === 1) return;

      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: 'thin', color: { argb: '14CBD5E1' } },
        };
      });
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=ai-customer-inquiries.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to export inquiries' });
  }
};
