import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import React from "react";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: React.JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'On-chain Project Registration',
    Svg: require('@site/static/img/soroban-wordmark-temp.svg').default,
    description: (
      <>
        Register and track open source projects directly on the Stellar blockchain. Commit hashes and metadata are verifiable by anyone, ensuring transparency and security.
      </>
    ),
  },
  {
    title: 'DAO Governance',
    Svg: require('@site/static/img/box-with-coin-outside.svg').default,
    description: (
      <>
        Every project gets its own DAO. Propose, vote, and execute decisions on-chain with public or anonymous voting, and weighted votes based on badges.
      </>
    ),
  },
  {
    title: 'Badge-based Membership',
    Svg: require('@site/static/img/team.svg').default,
    description: (
      <>
        Roles and voting power are managed through on-chain badges. Earn badges for your contributions and participate in project governance.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
