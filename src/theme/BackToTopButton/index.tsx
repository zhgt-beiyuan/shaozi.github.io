import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import { useLocation } from '@docusaurus/router';
import useScrollPosition from '@theme/hooks/useScrollPosition';

import PaperButton from '@site/src/components/PaperButton';
import styles from './styles.module.scss';

const threshold = 300;

const SupportsNativeSmoothScrolling = false;
// const SupportsNativeSmoothScrolling = ExecutionEnvironment.canUseDOM && 'scrollBehavior' in document.documentElement.style;

type CancelScrollTop = () => void;

function smoothScrollTopNative(): CancelScrollTop {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return () => {};
}

function smoothScrollTopPolyfill(): CancelScrollTop {
  let raf: number | null = null;
  function rafRecursion() {
    const currentScroll = document.documentElement.scrollTop;
    if (currentScroll > 0) {
      raf = requestAnimationFrame(rafRecursion);
      window.scrollTo(0, Math.floor(currentScroll * 0.85));
    }
  }
  rafRecursion();

  return () => raf && cancelAnimationFrame(raf);
}

type UseSmoothScrollTopReturn = {
  smoothScrollTop: () => void;
  cancelScrollToTop: CancelScrollTop;
};

function useSmoothScrollToTop(): UseSmoothScrollTopReturn {
  const lastCancelRef = useRef<CancelScrollTop | null>(null);

  function smoothScrollTop(): void {
    lastCancelRef.current = SupportsNativeSmoothScrolling
      ? smoothScrollTopNative()
      : smoothScrollTopPolyfill();
  }

  return {
    smoothScrollTop,
    cancelScrollToTop: () => lastCancelRef.current?.(),
  };
}

const BackToTopButton = (): JSX.Element => {
  const location = useLocation();
  const { smoothScrollTop, cancelScrollToTop } = useSmoothScrollToTop();
  const [show, setShow] = useState(false);

  useScrollPosition(
    ({ scrollY: scrollTop }, lastPosition) => {
      if (!lastPosition) return;

      const lastScrollTop = lastPosition.scrollY;
      const isScrollingUp = scrollTop < lastScrollTop;

      if (!isScrollingUp) cancelScrollToTop();

      if (scrollTop < threshold) {
        setShow(false);
        return;
      }

      if (isScrollingUp) {
        const documentHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight;
        if (scrollTop + windowHeight < documentHeight) {
          setShow(true);
        }
      } else {
        setShow(false);
      }
    },
    [location]
  );

  return (
    <PaperButton
      shape='circle'
      className={clsx('fixed z-200 opacity-0', styles.backToTopButton, {
        [styles.backToTopButtonShow]: show,
      })}
      onClick={() => smoothScrollTop()}
    >
      <span className='text-xl text-bold heading-none'>^</span>
      {/* <svg viewBox='0 0 24 24' width='20'>
        <path d='M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z' fill='currentColor' />
      </svg> */}
    </PaperButton>
  );
};

export default BackToTopButton;