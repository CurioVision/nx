import { motion, useAnimation } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export function YoutubeChannel(): JSX.Element {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    controls.start('visible');
  }, [controls, inView]);

  return (
    <article
      id="youtube-channel"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        ref={ref}
        animate={controls}
        initial="hidden"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              ease: 'linear',
              duration: 0.24,
              type: 'tween',
            },
          },
        }}
        className="bg-blue-nx-base overflow-hidden rounded-lg shadow-xl lg:grid lg:grid-cols-2 lg:gap-4"
      >
        <div className="px-6 pt-10 pb-12 sm:px-16 sm:pt-16 lg:order-2 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
          <div className="lg:self-center">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">A dedicated</span>
              <span className="block">Youtube Channel</span>
            </h1>
            <p className="mt-4 text-lg leading-6 text-gray-100">
              Get the latest news and video tutorials for free. Like and
              subscribe, you know the drill.
            </p>
            <Link href="https://www.youtube.com/c/Nrwl_io?utm_source=nx.dev">
              <a
                title="Get the latest resources about Nx"
                rel="noreferrer"
                target="_blank"
                className="text-blue-nx-base mt-8 inline-flex items-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium shadow hover:bg-gray-100"
              >
                Check the Nx Youtube channel
              </a>
            </Link>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1 -mt-6 lg:order-1"
        >
          <img
            loading="lazy"
            className="sm:-translate-x-22 -translate-x-6 translate-y-6 transform rounded-md object-cover object-left-top lg:translate-y-20"
            src="/images/nrwlio-channel.webp"
            alt="nrwl youtube channel"
          />
        </div>
      </motion.div>
    </article>
  );
}
