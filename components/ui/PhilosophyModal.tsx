import React from 'react';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lang: 'en' | 'es';
}

export const PhilosophyModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            title={lang === 'es' ? 'La Regla del 85% (NH)' : 'The 85% Rule (NH)'}
            accent="primary"
        >
            <div className="p-5 space-y-4 text-sm text-zinc-300 dark:text-zinc-400 overflow-y-auto max-h-[70vh]">
                
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 items-center mb-6">
                    <Icon name="Heart" size={24} className="text-red-400 shrink-0" />
                    <div>
                        <p className="font-bold text-red-200">Credits to Natural Hypertrophy</p>
                        <p className="text-xs text-red-300/80">
                            The following philosophy and the vast majority of the training templates included in this application 
                            are the brilliant work of <strong>Natural Hypertrophy</strong> (NH). All credit goes to him for these principles.
                        </p>
                    </div>
                </div>

                <h3 className="text-lg font-black text-white">The 85% Rule</h3>
                
                <p>
                    The goal of hypertrophy training is to get as much result from as little work as possible, to save us both time and effort. When most people hear that, they immediately think of minimalism, which is the practice of cutting down the workload by reducing sets, reps, days, and exercise selection, to keep only the essential portions of the program.
                </p>

                <p>
                    The issue is that while this practice does absolutely save a lot of time and energy, it does so at the detriment of results; and while some people are fine with getting only 80% of the gains if it means doing only half the work, I personally believe in a more maximized approach.
                </p>

                <p>
                    The problem with a maximized approach however is that you can end up doing too much, or not approaching training with the proper intensity, which can be as detrimental as not doing enough or being too intense. This is where the 85% rule comes into play.
                </p>

                <p className="font-bold text-primary-400">
                    This training philosophy promotes the idea of getting less out of more without sacrificing on results. To do so, instead of thinking about doing less, we are going to think about doing just enough.
                </p>

                <h4 className="text-base font-bold text-white mt-4">Stimulus Seeking, Not Fatigue Seeking</h4>
                <p>
                    The 85% rule isn’t fatigue seeking, it’s stimulus seeking, and that makes all the difference: we will only accept fatigue that will lead to maximal stimulus, and cut away the rest, but not so much that we sacrifice results. Any superfluous work gets cut, keeping only quality sets and reps.
                </p>
                <p>
                    In practice, this doesn’t mean that we will always stay away from putting in 100% effort when we train, but rather that we will try to be as close to 85% as possible most of the time. This number isn’t a training percentage, but instead represents the average rate of intensity that you must be putting into your lifts.
                </p>
                <p>
                    It also doesn’t mean that you should never go to failure: what you will avoid is the type of nonproductive fatigue that going to failure on certain lifts or with certain rep ranges can create.
                </p>

                <h4 className="text-base font-bold text-white mt-4">Progressive Overload & Step Loading</h4>
                <p>
                    This is how you apply the 85% rule to progressive overload: aim to work hard enough so that your current 85% of perceived exhaustion becomes a 70%, then adapt the weight to go back up to 85% and slowly build back volume until you’re back at 70% again. <strong>DO NOT do it in reverse.</strong>
                </p>
                <p>
                    You first add reps (evolving), then sets (on the same day or another day), then weight (step loading), always in small quantities. With step loading, you are guaranteed to hit your reps, because you have built up enough volume with the previous load to ensure that the next step will be successful.
                </p>

                <h4 className="text-base font-bold text-white mt-4">State of Flow</h4>
                <p>
                    The 85% rule aims to keep you in a state of flow, which is the perfect balance between overtraining (represented by anxiety) and undertraining (represented by boredom). If training is too easy you get bored and see no results, if training is too hard you get stressed and overworked, but if it’s just hard enough, what used to be 85% intensity soon feels like 70%.
                </p>
                
                <p className="italic text-zinc-500 mt-6 pt-4 border-t border-zinc-800">
                    "It is best to take two steps forward rather than three steps forward then two steps back, but it is also best to take one step forward rather than three steps forward then two steps back, since it cultivates momentum and doesn't breed frustration." - NH
                </p>
            </div>
        </Sheet>
    );
};