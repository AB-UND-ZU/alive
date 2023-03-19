function Air() {
  return null;
}

function Player() {
  return (
    <>
      <span className="Entity Eye">{'\u0128'}</span>
      <span className="Entity Body">{'\u010b'}</span>
      <span className="Entity Hair">~</span>
      <span className="Entity Health">{'\u0120'}</span>
    </>
  )
}

function Equipment({ type, material }) {
  const types = {
    Shield: '\u00ac',
    Weapon: '/',
    Spell: '\u0128',
  };
  return <span className={`Entity Equipment ${type} ${material}`}>{types[type]}</span>
}

function Item({ size, type }) {
  const sizes = {
    small: '·',
    medium: '∙',
    large: '\u0106',
    single: "'",
    double: '"',
    triple: '°',
    one: '-',
    two: '=',
    three: '\u2261',
    first: '.',
    second: '"',
    third: '\u00f7',
  };
  return <span className={`Entity Item ${type}`}>{sizes[size]}</span>
}

function Chest() {
  return (
    <>
      <span className="Entity Coin">{'\u011d'}</span>
      <span className="Entity Chest">{'\u0115'}</span>
      <span className="Entity Chest">{'\u011f'}</span>
    </>
  );
}

function Fire() {
  return (
    <>
      <span className="Entity Wood">{'\u010e'}</span>
      <span className="Entity Food">{'*'}</span>
      <span className="Entity Coin">{'·'}</span>
    </>
  );
}

function Monster({ value }) {
  const sizes = ['\u011d', '\u010f', '\u011e', '\u0110'];
  return (
    <>
      <span className="Entity Monster">{sizes[value]}</span>
      <span className="Entity Bar">{'\u0126'}</span>
    </>
  );
}

function Path() {
  return <span className="Entity Path">{'░'}</span>
}

function Water() {
  return <span className="Entity Water">{'▓'}</span>
}

function Sand() {
  return <span className="Entity Sand">{'▒'}</span>
}

function Wall({ direction = "none" }) {
  const directions = {
    up: '▀',
    right: '▐',
    down: '▄',
    left: '▌',
    none: '█',
  }
  return <span className="Entity Wall">{directions[direction]}</span>
}

function Plant({ size }) {
  if (size === "small") return <span className="Entity Plant">,</span>;
  if (size === "medium") return <span className="Entity Plant">{'\u03c4'}</span>;
  return (
    <>
      <span className="Entity Wood">{'\u2510'}</span>
      <span className="Entity Plant">{'#'}</span>
    </>
  );
}

function Lock() {
  return <span className={`Entity Lock`}>{'\u011c'}</span>
}

function Door() {
  return (
    <>
      <span className="Entity Door">{'\u0107'}</span>
    </>
  );
}

export const forestCells = [
  () => [<Equipment type="Shield" />, <Player />, <Equipment type="Weapon" />],

  () => <Monster value={0} />,
  
  () => <Item size="one" type="Wood" />,
  () => <Item size="two" type="Wood" />,
  () => <Item size="three" type="Wood" />,

  () => <Air />,
  () => <Air />,
  () => <Air />,
  () => <Air />,
  () => <Air />,

  () => <Wall direction="up" />,
  () => <Wall direction="right" />,
  () => <Wall direction="down" />,
  () => <Wall direction="left" />,
  () => <Wall />,
  () => <Wall />,
  () => <Wall />,

  () => [<Wall />, <Item size="first" type="Iron" />,],
  () => [<Wall />, <Item size="second" type="Iron" />,],
  () => [<Wall />, <Item size="third" type="Iron" />,],

  () => <Fire />,

  () => [<Plant size="small" />, <Item size="small" type="Mana" />],
  () => [<Plant size="small" />, <Item size="medium" type="Mana" />],
  () => [<Plant size="small" />, <Item size="large" type="Mana" />],
  () => [<Plant size="small" />],
  () => [<Plant size="small" />],

  () => [<Item size="single" type="Food" />,<Plant size="medium" />,],
  () => [<Plant size="medium" />],

  () => [<Plant size="large" />],
];

/*
  () => <Air />,
  () => <Air />,
  () => <Air />,
  () => <Air />,

  () => <Item size="tiny" type="Coin" />,
  () => <Item size="small" type="Coin" />,
  () => <Item size="medium" type="Coin" />,
  () => <Item size="large" type="Coin" />,

  () => <Door />,
  () => [<Door />, <Lock />],

  () => [<Plant value={0} />],
  () => [<Item size="single" type="Drink" />, <Plant value={0} />],
  () => [<Item size="double" type="Drink" />, <Plant value={0} />],
  () => [<Item size="triple" type="Drink" />, <Plant value={0} />],

  () => [<Plant value={1} />],
  () => [<Item size="small" type="Food" />, <Plant value={1} />],
  () => [<Item size="medium" type="Food" />, <Plant value={1} />],
  () => [<Item size="large" type="Food" />, <Plant value={1} />],

  () => <Wall />,

  () => <Water />,
  () => <Sand />,
  () => <Path />,

  () => [<Equipment type="Shield" />, <Player />, <Equipment type="Weapon" />],

  () => [<Chest />],
  () => [<Chest />, <Lock />],
  () => [<Chest />, <Equipment type="Weapon" />],

  () => <Monster value={0} />,
  () => <Monster value={1} />,
  () => <Monster value={2} />,
  () => <Monster value={3} />,
]
*/