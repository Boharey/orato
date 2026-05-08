// Centralized styles for Training components
export const TRAINING_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  
  .tr-root  { font-family:'DM Sans',sans-serif; }
  .tr-serif { font-family:'Playfair Display',serif; }

  @keyframes tr-up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  .tr-h  { animation:tr-up .5s ease both; }
  .tr-c1 { animation:tr-up .5s .08s ease both; }
  .tr-c2 { animation:tr-up .5s .15s ease both; }
  .tr-c3 { animation:tr-up .5s .22s ease both; }
  .tr-c4 { animation:tr-up .5s .29s ease both; }

  .tr-card {
    background:#fff;
    border:1px solid #E8EAE8;
    border-radius:20px;
    padding:32px;
    cursor:pointer;
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    transition:transform .26s cubic-bezier(.22,.68,0,1.15), box-shadow .26s ease, border-color .26s ease;
  }
  .tr-card:hover {
    transform:translateY(-5px);
    box-shadow:0 20px 52px rgba(46,79,79,.09);
  }
  .tr-card[data-t="teal"]:hover  { box-shadow:0 20px 52px rgba(46,79,79,.11),  0 0 0 1.5px rgba(46,79,79,.18); }
  .tr-card[data-t="orange"]:hover{ box-shadow:0 20px 52px rgba(255,107,53,.09), 0 0 0 1.5px rgba(255,107,53,.2); }

  .tr-bar {
    position:absolute; bottom:0; left:0; right:0; height:3px;
    transform:scaleX(0); transform-origin:left;
    transition:transform .32s ease;
  }
  .tr-card:hover .tr-bar { transform:scaleX(1); }

  .tr-arrow {
    width:34px; height:34px; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
    transition:transform .22s ease;
  }
  .tr-card:hover .tr-arrow { transform:translate(3px,-3px); }

  .tr-tag {
    display:inline-block; font-size:10px; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase;
    padding:4px 11px; border-radius:999px;
  }

  .tr-divider { height:1px; background:#EEF0EE; margin:0; }

  .tr-num {
    font-family:'Playfair Display',serif;
    font-size:10px; font-weight:900; letter-spacing:.14em; text-transform:uppercase;
    opacity:.28; margin-bottom:6px;
  }
`;

