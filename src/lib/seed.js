import { addDays, setHours, setMinutes, subDays, formatISO } from 'date-fns';

// All dates are relative to "now" so the demo always looks alive.
const at = (daysFromToday, hour, minute = 0) =>
  formatISO(setMinutes(setHours(addDays(new Date(), daysFromToday), hour), minute));
const daysAgo = (n) => formatISO(subDays(new Date(), n));

const AVATARS = 'https://api.dicebear.com/9.x/notionists-neutral/svg?seed=';
const img = (id, w = 600, h = 700) => `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop`;

export function seed() {
  return {
    settings: {
      studioName: 'InkSync Studio',
      address: '48 Rivington St, London',
      phone: '+44 20 7946 0321',
      email: 'hello@inksync.studio',
      currency: 'EUR',
      openTime: '10:00',
      closeTime: '20:00',
      defaultSessionMinutes: 120,
      depositPercent: 30,
      notifications: { appointmentReminders: true, lowStock: true, newClients: true },
    },
    artists: [
      { id: 'a1', name: 'Mara Voss', role: 'owner', styles: ['Fine line', 'Blackwork'], avatar: `${AVATARS}Mara`, phone: '+44 7700 900101', email: 'mara@inksync.studio', hourlyRate: 140, schedule: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false }, active: true },
      { id: 'a2', name: 'Diego Ferrer', role: 'artist', styles: ['Traditional', 'Neo-traditional'], avatar: `${AVATARS}Diego`, phone: '+44 7700 900102', email: 'diego@inksync.studio', hourlyRate: 120, schedule: { mon: false, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false }, active: true },
      { id: 'a3', name: 'Yuki Tanaka', role: 'artist', styles: ['Japanese', 'Irezumi'], avatar: `${AVATARS}Yuki`, phone: '+44 7700 900103', email: 'yuki@inksync.studio', hourlyRate: 150, schedule: { mon: true, tue: true, wed: false, thu: true, fri: true, sat: true, sun: false }, active: true },
      { id: 'a4', name: 'Nadia Petrova', role: 'apprentice', styles: ['Minimalist', 'Script'], avatar: `${AVATARS}Nadia`, phone: '+44 7700 900104', email: 'nadia@inksync.studio', hourlyRate: 70, schedule: { mon: true, tue: false, wed: true, thu: true, fri: true, sat: true, sun: false }, active: true },
    ],
    clients: [
      { id: 'c1', name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '+34 666 123 456', avatar: `${AVATARS}MariaG`, joinDate: daysAgo(420), visits: 8, totalSpent: 1240, preferredArtistId: 'a1', styles: ['Fine line'], notes: 'Prefers minimalist designs. Allergic to nickel.', status: 'active', lastVisit: daysAgo(31) },
      { id: 'c2', name: 'Carlos Ryan', email: 'carlos.ryan@email.com', phone: '+44 7911 234567', avatar: `${AVATARS}Carlos`, joinDate: daysAgo(510), visits: 12, totalSpent: 2180, preferredArtistId: 'a2', styles: ['Traditional'], notes: 'Collector of traditional pieces. Always on time.', status: 'active', lastVisit: daysAgo(12) },
      { id: 'c3', name: 'Ana Martinez', email: 'ana.martinez@email.com', phone: '+34 688 345 678', avatar: `${AVATARS}Ana`, joinDate: daysAgo(70), visits: 1, totalSpent: 180, preferredArtistId: 'a4', styles: ['Minimalist'], notes: 'First tattoo — needs extra reassurance and aftercare info.', status: 'new', lastVisit: daysAgo(70) },
      { id: 'c4', name: 'David Okafor', email: 'david.okafor@email.com', phone: '+44 7700 456789', avatar: `${AVATARS}David`, joinDate: daysAgo(600), visits: 15, totalSpent: 3450, preferredArtistId: 'a3', styles: ['Japanese'], notes: 'VIP. Working on a full sleeve, session 6 of ~10.', status: 'vip', lastVisit: daysAgo(8) },
      { id: 'c5', name: 'Laura Chen', email: 'laura.chen@email.com', phone: '+44 7700 567890', avatar: `${AVATARS}Laura`, joinDate: daysAgo(200), visits: 3, totalSpent: 640, preferredArtistId: 'a1', styles: ['Blackwork'], notes: 'Interested in a back piece — send blackwork flash drops.', status: 'active', lastVisit: daysAgo(95) },
      { id: 'c6', name: 'Tomasz Kowalski', email: 't.kowalski@email.com', phone: '+48 512 678 901', avatar: `${AVATARS}Tomasz`, joinDate: daysAgo(300), visits: 4, totalSpent: 890, preferredArtistId: 'a2', styles: ['Neo-traditional'], notes: '', status: 'active', lastVisit: daysAgo(160) },
      { id: 'c7', name: 'Sofia Dimitrova', email: 'sofia.d@email.com', phone: '+359 88 789 0123', avatar: `${AVATARS}Sofia`, joinDate: daysAgo(45), visits: 2, totalSpent: 420, preferredArtistId: 'a3', styles: ['Irezumi', 'Japanese'], notes: 'Referred by David. Planning koi half-sleeve.', status: 'new', lastVisit: daysAgo(9) },
      { id: 'c8', name: 'James Whitfield', email: 'j.whitfield@email.com', phone: '+44 7700 890123', avatar: `${AVATARS}James`, joinDate: daysAgo(720), visits: 6, totalSpent: 1560, preferredArtistId: 'a1', styles: ['Fine line', 'Script'], notes: 'Went quiet after last session — good nurture candidate.', status: 'inactive', lastVisit: daysAgo(210) },
    ],
    appointments: [
      { id: 'ap1', clientId: 'c1', artistId: 'a1', title: 'Fine line floral — forearm', start: at(0, 10), durationMinutes: 120, price: 280, deposit: 84, status: 'confirmed', notes: 'Stencil approved last week.' },
      { id: 'ap2', clientId: 'c2', artistId: 'a2', title: 'Traditional eagle — chest', start: at(0, 14, 30), durationMinutes: 180, price: 420, deposit: 126, status: 'confirmed', notes: '' },
      { id: 'ap3', clientId: 'c4', artistId: 'a3', title: 'Sleeve session 6 — dragon shading', start: at(1, 11), durationMinutes: 240, price: 600, deposit: 180, status: 'confirmed', notes: 'Bring reference book.' },
      { id: 'ap4', clientId: 'c3', artistId: 'a4', title: 'Minimal script — wrist', start: at(2, 12), durationMinutes: 60, price: 120, deposit: 36, status: 'pending', notes: 'First tattoo — schedule extra consult time.' },
      { id: 'ap5', clientId: 'c7', artistId: 'a3', title: 'Koi half-sleeve — consult + line work', start: at(3, 15), durationMinutes: 180, price: 450, deposit: 135, status: 'pending', notes: '' },
      { id: 'ap6', clientId: 'c5', artistId: 'a1', title: 'Blackwork back piece — consult', start: at(5, 17), durationMinutes: 45, price: 0, deposit: 0, status: 'confirmed', notes: 'Consultation only.' },
      { id: 'ap7', clientId: 'c6', artistId: 'a2', title: 'Neo-trad fox — calf', start: at(8, 13), durationMinutes: 150, price: 340, deposit: 102, status: 'confirmed', notes: '' },
      { id: 'ap8', clientId: 'c2', artistId: 'a2', title: 'Filler — inner arm', start: at(-3, 16), durationMinutes: 90, price: 200, deposit: 60, status: 'completed', notes: '' },
      { id: 'ap9', clientId: 'c4', artistId: 'a3', title: 'Sleeve session 5', start: at(-8, 11), durationMinutes: 240, price: 600, deposit: 180, status: 'completed', notes: '' },
      { id: 'ap10', clientId: 'c1', artistId: 'a1', title: 'Touch-up — ankle', start: at(-31, 12), durationMinutes: 45, price: 60, deposit: 0, status: 'completed', notes: '' },
      { id: 'ap11', clientId: 'c8', artistId: 'a1', title: 'Script quote — ribs', start: at(4, 10), durationMinutes: 90, price: 220, deposit: 66, status: 'cancelled', notes: 'Client asked to reschedule, no new date yet.' },
    ],
    designs: [
      { id: 'd1', title: 'Serpent & Peonies', artistId: 'a3', style: 'Japanese', bodyPart: 'Forearm', price: 450, image: img('photo-1611501275019-9b5cda994e8d'), tags: ['flash', 'available'], likes: 42 },
      { id: 'd2', title: 'Single-needle Rose', artistId: 'a1', style: 'Fine line', bodyPart: 'Collarbone', price: 220, image: img('photo-1562962230-16e4623d36e6'), tags: ['flash', 'available'], likes: 67 },
      { id: 'd3', title: 'Old-school Swallow Pair', artistId: 'a2', style: 'Traditional', bodyPart: 'Chest', price: 300, image: img('photo-1590246814883-57c511e76523'), tags: ['classic'], likes: 38 },
      { id: 'd4', title: 'Geometric Wolf', artistId: 'a1', style: 'Blackwork', bodyPart: 'Thigh', price: 520, image: img('photo-1542856391-010fb87dcfed'), tags: ['custom', 'large'], likes: 91 },
      { id: 'd5', title: 'Koi Ascending', artistId: 'a3', style: 'Irezumi', bodyPart: 'Half sleeve', price: 900, image: img('photo-1568515045052-f9a854d70bfd'), tags: ['custom', 'multi-session'], likes: 54 },
      { id: 'd6', title: 'Botanical Script', artistId: 'a4', style: 'Script', bodyPart: 'Wrist', price: 110, image: img('photo-1598371839696-5c5bb00bdc28'), tags: ['flash', 'small'], likes: 23 },
      { id: 'd7', title: 'Neo-trad Fox', artistId: 'a2', style: 'Neo-traditional', bodyPart: 'Calf', price: 340, image: img('photo-1565058379802-bbe93b2f703a'), tags: ['flash', 'available'], likes: 47 },
      { id: 'd8', title: 'Dagger & Moth', artistId: 'a2', style: 'Traditional', bodyPart: 'Forearm', price: 260, image: img('photo-1543059080-f9b1272213d5'), tags: ['flash'], likes: 31 },
    ],
    inventory: [
      { id: 'i1', name: 'Premium Black Ink 30ml', brand: 'Eternal Ink', category: 'inks', stock: 25, minStock: 10, price: 15.99, supplier: 'Killer Ink' },
      { id: 'i2', name: 'Needles RL 07', brand: 'Cheyenne', category: 'needles', stock: 5, minStock: 20, price: 2.5, supplier: 'Barber DTS' },
      { id: 'i3', name: 'Rotary Machine Pro', brand: 'Bishop', category: 'machines', stock: 3, minStock: 2, price: 450, supplier: 'Killer Ink' },
      { id: 'i4', name: 'Healing Cream 50g', brand: 'Bepanthen', category: 'aftercare', stock: 8, minStock: 15, price: 8.99, supplier: 'MedSupply' },
      { id: 'i5', name: 'Nitrile Gloves M (box)', brand: 'SafeTouch', category: 'hygiene', stock: 45, minStock: 20, price: 12.99, supplier: 'MedSupply' },
      { id: 'i6', name: 'Cartridges RM 09', brand: 'Cheyenne', category: 'needles', stock: 32, minStock: 15, price: 3.2, supplier: 'Barber DTS' },
      { id: 'i7', name: 'Stencil Paper (100)', brand: 'Spirit', category: 'supplies', stock: 12, minStock: 10, price: 24.5, supplier: 'Killer Ink' },
      { id: 'i8', name: 'Cling Film Roll', brand: 'ProWrap', category: 'hygiene', stock: 6, minStock: 8, price: 4.75, supplier: 'MedSupply' },
    ],
    proposals: [
      { id: 'p1', clientId: 'c5', artistId: 'a1', title: 'Blackwork back piece — 4 sessions', amount: 1800, deposit: 540, status: 'sent', sentAt: daysAgo(3), depositLink: 'https://pay.inksync.studio/p1', notes: 'Includes custom design work.' },
      { id: 'p2', clientId: 'c7', artistId: 'a3', title: 'Koi half-sleeve — 3 sessions', amount: 1350, deposit: 405, status: 'deposit_paid', sentAt: daysAgo(9), paidAt: daysAgo(6), depositLink: 'https://pay.inksync.studio/p2', notes: '' },
      { id: 'p3', clientId: 'c4', artistId: 'a3', title: 'Sleeve completion — sessions 7-10', amount: 2400, deposit: 720, status: 'accepted', sentAt: daysAgo(15), paidAt: daysAgo(13), depositLink: 'https://pay.inksync.studio/p3', notes: 'VIP rate applied.' },
      { id: 'p4', clientId: 'c3', artistId: 'a4', title: 'Minimal script — wrist', amount: 120, deposit: 36, status: 'draft', sentAt: null, depositLink: null, notes: '' },
      { id: 'p5', clientId: 'c8', artistId: 'a1', title: 'Fine line sleeve concept', amount: 2100, deposit: 630, status: 'expired', sentAt: daysAgo(60), depositLink: 'https://pay.inksync.studio/p5', notes: 'No response — follow up via nurture.' },
      { id: 'p6', clientId: 'c6', artistId: 'a2', title: 'Neo-trad fox — calf', amount: 340, deposit: 102, status: 'deposit_paid', sentAt: daysAgo(5), paidAt: daysAgo(4), depositLink: 'https://pay.inksync.studio/p6', notes: '' },
    ],
    conversations: [
      {
        id: 'cv1', clientId: 'c7', channel: 'instagram', unread: 2, messages: [
          { id: 'm1', from: 'client', text: 'Hi! I loved the koi design Yuki posted. Is the consult still on for this week?', at: daysAgo(1) },
          { id: 'm2', from: 'studio', text: 'Hey Sofia! Yes — Thursday 15:00 with Yuki. We’ll go over placement and sizing.', at: daysAgo(1) },
          { id: 'm3', from: 'client', text: 'Perfect. Can I bring some reference photos?', at: daysAgo(0) },
          { id: 'm4', from: 'client', text: 'Also — is the deposit refundable if we change the design?', at: daysAgo(0) },
        ],
      },
      {
        id: 'cv2', clientId: 'c3', channel: 'whatsapp', unread: 1, messages: [
          { id: 'm5', from: 'client', text: 'Hi, it’s Ana. A bit nervous about Saturday 😅 how long will it take?', at: daysAgo(2) },
          { id: 'm6', from: 'studio', text: 'Totally normal! Yours is about an hour including prep. Nadia will walk you through everything.', at: daysAgo(2) },
          { id: 'm7', from: 'client', text: 'Thank you! Should I eat before coming?', at: daysAgo(0) },
        ],
      },
      {
        id: 'cv3', clientId: 'c2', channel: 'facebook', unread: 0, messages: [
          { id: 'm8', from: 'client', text: 'Diego’s eagle sketch looks incredible. Confirming Friday.', at: daysAgo(3) },
          { id: 'm9', from: 'studio', text: 'You’re locked in for Friday 14:30. Deposit received — see you then!', at: daysAgo(3) },
        ],
      },
      {
        id: 'cv4', clientId: 'c5', channel: 'instagram', unread: 1, messages: [
          { id: 'm10', from: 'client', text: 'Saw the proposal — the back piece plan looks great. Thinking it over this week.', at: daysAgo(2) },
        ],
      },
    ],
    activities: [
      { id: 'act1', type: 'proposal', priority: 'high', text: 'Proposal for Laura Chen (€1,800) sent 3 days ago — no response yet. Follow up.', time: daysAgo(0), done: false, link: '/proposals' },
      { id: 'act2', type: 'inventory', priority: 'high', text: 'Needles RL 07 critically low: 5 left (min 20). Reorder from Barber DTS.', time: daysAgo(0), done: false, link: '/inventory' },
      { id: 'act3', type: 'appointment', priority: 'medium', text: 'Ana Martinez (first tattoo) is pending confirmation for Saturday.', time: daysAgo(1), done: false, link: '/calendar' },
      { id: 'act4', type: 'message', priority: 'medium', text: '4 unread client messages across Instagram and WhatsApp.', time: daysAgo(0), done: false, link: '/messages' },
      { id: 'act5', type: 'client', priority: 'low', text: 'James Whitfield inactive for 7 months — add to win-back campaign.', time: daysAgo(2), done: false, link: '/nurture' },
      { id: 'act6', type: 'appointment', priority: 'low', text: 'Cita completed: David Okafor — sleeve session 5.', time: daysAgo(8), done: true, link: '/calendar' },
    ],
    nurtures: [
      { id: 'n1', name: 'Aftercare check-in', trigger: '3 days after appointment', channel: 'whatsapp', active: true, sent: 34, opened: 31, template: 'Hey {{name}}! How’s the new piece healing? Remember: no sun, no pools, moisturize 2x a day. Send us a photo if anything looks off.' },
      { id: 'n2', name: 'Win-back — 6 months quiet', trigger: '180 days since last visit', channel: 'email', active: true, sent: 12, opened: 7, template: 'Hi {{name}}, it’s been a while! {{artist}} has new flash designs in your style. Book this month and your deposit counts double toward the final price.' },
      { id: 'n3', name: 'Birthday ink offer', trigger: 'client birthday', channel: 'email', active: false, sent: 8, opened: 6, template: 'Happy birthday {{name}}! 🎂 Celebrate with 15% off any piece booked within 30 days.' },
    ],
  };
}
