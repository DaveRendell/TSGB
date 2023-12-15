import * as React from "react"

interface Props {
  tabs: { [name: string]: () => React.ReactNode }
}

export default function Tabs({ tabs }: Props) {
  const [activeTab, setActiveTab] = React.useState(Object.keys(tabs)[0])

  return (<section>
    <nav className="tabs">
      <ul>
        {Object.keys(tabs).map((name, i) =>
          name == activeTab
            ? <li className="selected">{name}</li>
            : <li key={i}><button onClick={() => setActiveTab(name)}>{name}</button></li>
        )}
      </ul>
      <div className="tabs-content">
        { tabs[activeTab]() }
      </div>
      
    </nav>

  </section>)
}

