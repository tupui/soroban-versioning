import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Built with Soroban',
    Svg: require('@site/static/img/soroban-wordmark-temp.svg').default,
    description: (
      <>
        Tansu is a Soroban smart contract running on the Stellar blockchain. This allows extremely low operational costs, efficiency and security with a fast finality.
      </>
    ),
  },
  {
    title: 'Git on-chain',
    Svg: require('@site/static/img/git-logo.svg').default,
    description: (
      <>
        Tansu bring decentralization back to Git. Push new hashes on-chain and help secure the supply chain by allowing anyone to track code updates.
      </>
    ),
  },
  {
    title: 'Open Source',
    Svg: require('@site/static/img/open_source_initiative.svg').default,
    description: (
      <>
        Tansu track Open Source projects so you can build with confidence with Open Source. Everything Tansu is Open Source.
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

export default function HomepageFeatures(): JSX.Element {
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
