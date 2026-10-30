import { ShopTile, type ShopTileProps } from "./ShopTile";

/**
 * ShopTiles in a ply row: 4 across, then 2 once the container is ≤ 767px.
 * The row renders its own unit-* wrappers (design-plan §2.3).
 */
export function TileGrid({ tiles }: { tiles: ShopTileProps[] }) {
  return (
    <div className="container-query">
      <ul className="units-row flat-list no-margin" role="list">
        {tiles.map((tile) => (
          <li key={tile.href} className="unit-25 container-tablet-unit-50">
            <ShopTile {...tile} />
          </li>
        ))}
      </ul>
    </div>
  );
}
