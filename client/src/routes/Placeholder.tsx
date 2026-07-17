import { Icon, type IconName } from "../components/Icon";
import "./Placeholder.css";

/**
 * Stub for the four surfaces not yet built. Deliberately states what the screen
 * will do rather than pretending to be empty — an unbuilt screen and a screen
 * with no data must never look the same (design.md §8).
 */

type Props = {
  title: string;
  icon: IconName;
  body: string;
};

export function Placeholder({ title, icon, body }: Props) {
  return (
    <div className="placeholder">
      <span className="placeholder__icon">
        <Icon name={icon} size={30} strokeWidth={1.4} />
      </span>
      <h1 className="placeholder__title">{title}</h1>
      <p className="placeholder__body">{body}</p>
      <span className="placeholder__tag">Not yet built</span>
    </div>
  );
}
