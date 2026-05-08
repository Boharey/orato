// Centralized styles for Dashboard components
export const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  
  .db-root  { font-family:'DM Sans',sans-serif; }
  .db-serif { font-family:'Playfair Display',serif; }

  @keyframes db-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .db-h  { animation:db-up .5s ease both; }
  .db-c1 { animation:db-up .5s .06s ease both; }
  .db-c2 { animation:db-up .5s .12s ease both; }
  .db-c3 { animation:db-up .5s .18s ease both; }
  .db-c4 { animation:db-up .5s .24s ease both; }
  .db-f1 { animation:db-up .5s .30s ease both; }

  .db-card {
    background:#fff;
    border:1px solid #E8EAE8;
    border-radius:16px;
    padding:24px;
    cursor:default;
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    transition:transform .26s cubic-bezier(.22,.68,0,1.15), box-shadow .26s ease, border-color .26s ease;
  }
  .db-card:hover {
    transform:translateY(-4px);
    box-shadow:0 16px 40px rgba(46,79,79,.08);
    border-color:rgba(46,79,79,.15);
  }

  .db-icon-wrapper {
    width:44px; height:44px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
    transition:transform .22s ease;
  }
  .db-card:hover .db-icon-wrapper { transform:scale(1.08); }
`;
